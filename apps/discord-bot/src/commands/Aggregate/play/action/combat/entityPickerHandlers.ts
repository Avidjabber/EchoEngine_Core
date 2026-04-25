import { ButtonInteraction, MessageFlags, TextChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { messages } from '@echoengine/shared';
import { getSetup, addEntityToTeam, addPendingInvite, isEntityInAnyTeam } from './setupState';
import { getCachedPickerEntities, invalidatePickerCache } from './entityPickerCache';
import { buildEntityPickerComponents } from './entityPickerComponents';
import { buildTeamComponents, buildControlComponents } from './setupComponents';
import { buildInviteComponents } from './inviteComponents';

const EXPIRED_MSG = 'Session expired — please close this and try again.';

function expiredReply(interaction: ButtonInteraction) {
    return interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: EXPIRED_MSG }] }],
    } as never);
}

// customId: pa_epick_invite_page:{setupId}:{teamIndex}:{page}
export async function handlePaEpickInvitePage(interaction: ButtonInteraction): Promise<void> {
    const parts     = interaction.customId.split(':');
    const setupId   = parts[1];
    const teamIndex = parseInt(parts[2], 10);
    const page      = parseInt(parts[3], 10);

    await interaction.deferUpdate();

    const entities = getCachedPickerEntities(setupId, teamIndex, 'invite');
    if (!entities) { await expiredReply(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEntityPickerComponents(entities, setupId, teamIndex, 'invite', page) as never,
    });
}

// customId: pa_epick_signup_page:{setupId}:{teamIndex}:{page}
export async function handlePaEpickSignupPage(interaction: ButtonInteraction): Promise<void> {
    const parts     = interaction.customId.split(':');
    const setupId   = parts[1];
    const teamIndex = parseInt(parts[2], 10);
    const page      = parseInt(parts[3], 10);

    await interaction.deferUpdate();

    const entities = getCachedPickerEntities(setupId, teamIndex, 'signup');
    if (!entities) { await expiredReply(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEntityPickerComponents(entities, setupId, teamIndex, 'signup', page) as never,
    });
}

// customId: pa_epick_invite_pick:{setupId}:{teamIndex}:{page}:{entityId}
export async function handlePaEpickInvitePick(interaction: ButtonInteraction): Promise<void> {
    const parts     = interaction.customId.split(':');
    const setupId   = parts[1];
    const teamIndex = parseInt(parts[2], 10);
    const entityId  = parseInt(parts[4], 10);

    await interaction.deferUpdate();

    const setup    = getSetup(setupId);
    const entities = getCachedPickerEntities(setupId, teamIndex, 'invite');
    const entity   = entities?.find(e => e.id === entityId);

    if (!setup || !entity) { await expiredReply(interaction); return; }
    if (isEntityInAnyTeam(setupId, entityId)) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: `**${entity.name}** is already in this session.` }] }],
        } as never);
        return;
    }

    // Post invite message in channel
    const channel    = interaction.channel as TextChannel;
    const inviteMsg  = await channel.send({
        components: buildInviteComponents(setup, teamIndex, entity.userId, entityId, entity.name) as never,
    });

    addPendingInvite(setupId, {
        messageId:    inviteMsg.id,
        entityId,
        entityName:   entity.name,
        targetUserId: entity.userId,
        teamIndex,
    });

    // Update control message to show pending count
    const controlMsg = await channel.messages.fetch(setup.controlMessageId).catch(() => null);
    if (controlMsg) await controlMsg.edit({ components: buildControlComponents(setup) as never });

    // Confirm to the initiator in the ephemeral picker
    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.success,
            components:   [{ type: 10, content: `Invite sent to **${entity.name}**. You can close this.` }],
        }],
    } as never);
}

// customId: pa_epick_signup_pick:{setupId}:{teamIndex}:{page}:{entityId}
export async function handlePaEpickSignupPick(interaction: ButtonInteraction): Promise<void> {
    const parts     = interaction.customId.split(':');
    const setupId   = parts[1];
    const teamIndex = parseInt(parts[2], 10);
    const entityId  = parseInt(parts[4], 10);

    await interaction.deferUpdate();

    const setup    = getSetup(setupId);
    const entities = getCachedPickerEntities(setupId, teamIndex, 'signup');
    const entity   = entities?.find(e => e.id === entityId);

    if (!setup || !entity) { await expiredReply(interaction); return; }
    if (isEntityInAnyTeam(setupId, entityId)) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: 'That character is already in this session.' }] }],
        } as never);
        return;
    }

    const added = addEntityToTeam(setupId, teamIndex, {
        entityId,
        entityName: entity.name,
        userId:     entity.userId,
    });

    if (!added) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: 'Could not sign up — the team may be full.' }] }],
        } as never);
        return;
    }

    invalidatePickerCache(setupId);

    const channel = interaction.channel as TextChannel;
    const team    = setup.teams[teamIndex];
    const teamMsg = await channel.messages.fetch(team.messageId).catch(() => null);
    if (teamMsg) await teamMsg.edit({ components: buildTeamComponents(setup, team) as never });

    const controlMsg = await channel.messages.fetch(setup.controlMessageId).catch(() => null);
    if (controlMsg) await controlMsg.edit({ components: buildControlComponents(setup) as never });

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.success,
            components:   [{ type: 10, content: `**${entity.name}** has been added to Team ${teamIndex + 1}!` }],
        }],
    } as never);
}

// customId: pa_epick_cancel
export async function handlePaEpickCancel(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    await interaction.deleteReply();
}
