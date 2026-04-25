import { ButtonInteraction, MessageFlags, TextChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { messages } from '@echoengine/shared';
import {
    getSetup, deleteSetup, addTeam, removeEntityFromTeam,
    isEntityInAnyTeam, isUserInAnyTeam, MAX_TEAMS,
} from './setupState';
import { buildTeamComponents, buildControlComponents } from './setupComponents';
import { buildEntityPickerComponents } from './entityPickerComponents';
import { setCachedPickerEntities, invalidatePickerCache } from './entityPickerCache';
import { fetchInviteTargets, fetchSignupTargets } from '../../../../../services/play/combatService';

function errReply(interaction: ButtonInteraction, content: string) {
    return interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content }] }],
    } as never);
}

async function refreshTeamMessage(channel: TextChannel, setup: ReturnType<typeof getSetup>, teamIndex: number) {
    if (!setup) return;
    const team = setup.teams[teamIndex];
    if (!team) return;
    const msg = await channel.messages.fetch(team.messageId).catch(() => null);
    if (msg) await msg.edit({ components: buildTeamComponents(setup, team) as never });
}

async function refreshControlMessage(channel: TextChannel, setup: ReturnType<typeof getSetup>) {
    if (!setup) return;
    const msg = await channel.messages.fetch(setup.controlMessageId).catch(() => null);
    if (msg) await msg.edit({ components: buildControlComponents(setup) as never });
}

// customId: pa_combat_add_char:{setupId}:{teamIndex}
export async function handlePaCombatAddChar(interaction: ButtonInteraction): Promise<void> {
    const parts     = interaction.customId.split(':');
    const setupId   = parts[1];
    const teamIndex = parseInt(parts[2], 10);

    const setup = getSetup(setupId);
    if (!setup || interaction.user.id !== setup.initiatorUserId) {
        await interaction.deferUpdate(); return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Filter out entities already in the setup
    let entities = await fetchInviteTargets(interaction.guildId!, setup.initiatorEntityId, setup.type);
    if (!entities.success) {
        await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }] } as never);
        return;
    }
    const eligible = (entities.value ?? []).filter(e => !isEntityInAnyTeam(setupId, e.id));
    setCachedPickerEntities(setupId, teamIndex, 'invite', eligible);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEntityPickerComponents(eligible, setupId, teamIndex, 'invite', 0) as never,
    });
}

// customId: pa_combat_signup:{setupId}:{teamIndex}
export async function handlePaCombatSignup(interaction: ButtonInteraction): Promise<void> {
    const parts     = interaction.customId.split(':');
    const setupId   = parts[1];
    const teamIndex = parseInt(parts[2], 10);

    const setup = getSetup(setupId);
    if (!setup) { await interaction.deferUpdate(); return; }

    // Only one character per user allowed across all teams
    if (isUserInAnyTeam(setupId, interaction.user.id)) {
        await interaction.reply({
            flags:      MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: 'You already have a character in this session.' }] }],
        } as never);
        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const result = await fetchSignupTargets(interaction.guildId!, interaction.user.id, setup.initiatorFactionId, setup.type);
    if (!result.success) {
        await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }] } as never);
        return;
    }
    const eligible = (result.value ?? []).filter(e => !isEntityInAnyTeam(setupId, e.id));
    setCachedPickerEntities(setupId, teamIndex, 'signup', eligible);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEntityPickerComponents(eligible, setupId, teamIndex, 'signup', 0) as never,
    });
}

// customId: pa_combat_remove:{setupId}:{teamIndex}:{entityId}
export async function handlePaCombatRemove(interaction: ButtonInteraction): Promise<void> {
    const parts     = interaction.customId.split(':');
    const setupId   = parts[1];
    const teamIndex = parseInt(parts[2], 10);
    const entityId  = parseInt(parts[3], 10);

    await interaction.deferUpdate();

    const setup = getSetup(setupId);
    if (!setup) return;

    const team         = setup.teams[teamIndex];
    const entity       = team?.entities.find(e => e.entityId === entityId);
    const isInitiator  = interaction.user.id === setup.initiatorUserId;
    const isOwner      = entity?.userId === interaction.user.id;

    // Creator can remove anyone; owners can remove themselves (unless they started the session)
    if (!isInitiator && !isOwner) return;
    if (entity?.entityId === setup.initiatorEntityId) return;

    removeEntityFromTeam(setupId, teamIndex, entityId);
    invalidatePickerCache(setupId);

    const channel = interaction.channel as TextChannel;
    await refreshTeamMessage(channel, setup, teamIndex);
    await refreshControlMessage(channel, setup);
}

// customId: pa_combat_add_team:{setupId}
export async function handlePaCombatAddTeam(interaction: ButtonInteraction): Promise<void> {
    const setupId = interaction.customId.split(':')[1];

    await interaction.deferUpdate();

    const setup = getSetup(setupId);
    if (!setup || interaction.user.id !== setup.initiatorUserId) return;
    if (setup.teams.length >= MAX_TEAMS) return;

    const channel = interaction.channel as TextChannel;

    // Replace control message with new team message, then re-post control
    const controlMsg = await channel.messages.fetch(setup.controlMessageId).catch(() => null);

    const placeholderTeamIndex = setup.teams.length;
    const teamMsg = await channel.send({
        components: buildTeamComponents(setup, { teamIndex: placeholderTeamIndex, messageId: '', entities: [] }) as never,
    });

    const team = addTeam(setupId, teamMsg.id);
    if (!team) { await teamMsg.delete().catch(() => null); return; }

    // Re-send the control message after the new team card
    if (controlMsg) await controlMsg.delete().catch(() => null);
    const newControlMsg = await channel.send({ components: buildControlComponents(setup) as never });
    setup.controlMessageId = newControlMsg.id;

    // Refresh team message with correct team index
    await teamMsg.edit({ components: buildTeamComponents(setup, team) as never });
}

// customId: pa_combat_cancel:{setupId}
export async function handlePaCombatCancel(interaction: ButtonInteraction): Promise<void> {
    const setupId = interaction.customId.split(':')[1];

    await interaction.deferUpdate();

    const setup = getSetup(setupId);
    if (!setup || interaction.user.id !== setup.initiatorUserId) return;

    const channel = interaction.channel as TextChannel;

    for (const team of setup.teams) {
        const msg = await channel.messages.fetch(team.messageId).catch(() => null);
        if (msg) await msg.delete().catch(() => null);
    }
    for (const invite of setup.pendingInvites) {
        const msg = await channel.messages.fetch(invite.messageId).catch(() => null);
        if (msg) await msg.delete().catch(() => null);
    }
    const controlMsg = await channel.messages.fetch(setup.controlMessageId).catch(() => null);
    if (controlMsg) await controlMsg.delete().catch(() => null);

    deleteSetup(setupId);
    invalidatePickerCache(setupId);
}

// customId: pa_combat_start:{setupId}
// Energy check and removal of ineligible entities happens here; actual combat record creation is a future step.
export async function handlePaCombatStart(interaction: ButtonInteraction): Promise<void> {
    const setupId = interaction.customId.split(':')[1];

    await interaction.deferUpdate();

    const setup = getSetup(setupId);
    if (!setup || interaction.user.id !== setup.initiatorUserId) return;

    const channel = interaction.channel as TextChannel;

    // Delete all pending invites — they can no longer accept
    for (const invite of setup.pendingInvites) {
        const msg = await channel.messages.fetch(invite.messageId).catch(() => null);
        if (msg) await msg.delete().catch(() => null);
    }
    setup.pendingInvites = [];

    // TODO: fetch current energy for all entities, remove those below the action's energyCost,
    //       remove empty teams, abort if fewer than 2 teams remain with entities,
    //       create the combat instance DB record, and update/delete setup messages.
    //       For now, mark control message as "Starting..." pending full implementation.
    const controlMsg = await channel.messages.fetch(setup.controlMessageId).catch(() => null);
    if (controlMsg) {
        await controlMsg.edit({
            components: [{
                type:         17,
                accent_color: colors.special,
                components:   [{ type: 10, content: '-# Combat starting… (not yet fully implemented)' }],
            }],
        } as never);
    }
}
