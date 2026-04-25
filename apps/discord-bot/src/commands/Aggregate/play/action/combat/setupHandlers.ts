import { ButtonInteraction, ChannelType, ForumChannel, MessageFlags, TextChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { messages } from '@echoengine/shared';
import {
    getSetup, deleteSetup, addTeam, removeEntityFromTeam,
    isEntityInAnyTeam, isUserInAnyTeam, MAX_TEAMS,
} from './setupState';
import { buildTeamComponents, buildControlComponents } from './setupComponents';
import { buildEntityPickerComponents } from './entityPickerComponents';
import { setCachedPickerEntities, invalidatePickerCache } from './entityPickerCache';
import { fetchInviteTargets, fetchSignupTargets, startCombat } from '../../../../../services/play/combatService';
import { buildCombatAnnouncementComponents, buildCombatStateComponents, buildTurnPromptComponents } from './combatTurnComponents';
import { setTurnEntry } from './combatTurnState';

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
export async function handlePaCombatStart(interaction: ButtonInteraction): Promise<void> {
    const setupId = interaction.customId.split(':')[1];

    await interaction.deferUpdate();

    const setup = getSetup(setupId);
    if (!setup || interaction.user.id !== setup.initiatorUserId) return;

    const channel = interaction.channel as TextChannel;

    // Delete pending invites — they can no longer accept
    for (const invite of setup.pendingInvites) {
        const msg = await channel.messages.fetch(invite.messageId).catch(() => null);
        if (msg) await msg.delete().catch(() => null);
    }

    // Snapshot state before cleanup (includes userId for turn pings)
    const snapshotTeams = setup.teams.map(t => ({
        messageId: t.messageId,
        entities:  t.entities.map(e => ({ entityId: e.entityId, entityName: e.entityName, userId: e.userId })),
    }));
    const entityNameMap = new Map(snapshotTeams.flatMap(t => t.entities.map(e => [e.entityId, e.entityName])));
    const entityUserMap = new Map(snapshotTeams.flatMap(t => t.entities.map(e => [e.entityId, e.userId])));
    const { guildId, type, controlMessageId } = setup;

    const result = await startCombat(
        guildId,
        type,
        snapshotTeams.map(t => ({ entities: t.entities.map(e => ({ entityId: e.entityId })) })),
    );

    // Clean up all setup messages
    for (const team of snapshotTeams) {
        const msg = await channel.messages.fetch(team.messageId).catch(() => null);
        if (msg) await msg.delete().catch(() => null);
    }
    const controlMsg = await channel.messages.fetch(controlMessageId).catch(() => null);
    if (controlMsg) await controlMsg.delete().catch(() => null);

    deleteSetup(setupId);
    invalidatePickerCache(setupId);

    if (!result.success || !result.value) {
        await channel.send({
            components: [{
                type:         17,
                accent_color: colors.error,
                components:   [{ type: 10, content: 'Something went wrong starting the session. Please try again.' }],
            }],
        } as never);
        return;
    }

    const combatResult = result.value;
    const { removedEntityIds } = combatResult;
    const removedNames = removedEntityIds.map((id: number) => entityNameMap.get(id)).filter(Boolean) as string[];

    if (!combatResult.success) {
        let content = `The ${type} session could not start — not enough eligible teams.`;
        if (removedNames.length > 0) {
            content += `\n-# ${removedNames.join(', ')} did not have enough energy to participate.`;
        }
        await channel.send({
            components: [{
                type:         17,
                accent_color: colors.error,
                components:   [{ type: 10, content }],
            }],
        } as never);
        return;
    }

    const { activeCombatId, participants, allowsFleeing } = combatResult;
    const typeLabel = type === 'spar' ? 'Spar' : 'Fight';

    // Channel announcement — @mentions everyone so they get notified
    const announcementMsg = await channel.send({
        components: buildCombatAnnouncementComponents(
            activeCombatId, type, participants, entityNameMap, entityUserMap, removedNames,
        ) as never,
    });

    // Create a thread off the announcement; fall back to posting in the channel if unsupported
    const threadName = buildCombatThreadName(typeLabel, participants, entityNameMap);
    const thread = await (async () => {
        try {
            if ((channel as { type: ChannelType }).type === ChannelType.GuildForum) {
                return await (channel as unknown as ForumChannel).threads.create({
                    name:                threadName,
                    autoArchiveDuration: 1440,
                    message:             { content: `⚔ ${typeLabel} — Combat #${activeCombatId}` },
                });
            }
            return await (announcementMsg as any).startThread({ name: threadName, autoArchiveDuration: 1440 });
        } catch {
            return null;
        }
    })();

    const postTarget = thread ?? channel;

    // Post combat state (teams + initiative order) in the thread
    await postTarget.send({
        components: buildCombatStateComponents(activeCombatId, type, participants, entityNameMap) as never,
    });

    // Post first-turn prompt and seed turn state
    const first = participants[0];
    if (first) {
        const firstEntityName = entityNameMap.get(first.entityId) ?? 'Unknown';
        const firstUserId     = entityUserMap.get(first.entityId);
        const turnMsg = await postTarget.send({
            components: buildTurnPromptComponents(
                activeCombatId, first.entityId, firstEntityName, firstUserId, 1, 0, allowsFleeing,
            ) as never,
        });
        setTurnEntry(activeCombatId, turnMsg.id, postTarget.id, first.entityId, firstEntityName, firstUserId, 1, allowsFleeing);
    }
}

function buildCombatThreadName(
    typeLabel:    string,
    participants: Array<{ entityId: number; allyFactionId: number }>,
    nameMap:      Map<number, string>,
): string {
    const teamGroups = new Map<number, string[]>();
    for (const p of participants) {
        if (!teamGroups.has(p.allyFactionId)) teamGroups.set(p.allyFactionId, []);
        teamGroups.get(p.allyFactionId)!.push(nameMap.get(p.entityId) ?? 'Unknown');
    }
    const teamStrings = [...teamGroups.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, names]) => names.join(' & '));
    const name = `${typeLabel}: ${teamStrings.join(' vs ')}`;
    return name.length <= 100 ? name : name.slice(0, 97) + '…';
}
