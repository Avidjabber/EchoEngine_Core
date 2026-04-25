import { ButtonInteraction, MessageFlags, TextChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { getSetup, addEntityToTeam, resolvePendingInvite, isUserInAnyTeam } from './setupState';
import { buildTeamComponents, buildControlComponents } from './setupComponents';
import { invalidatePickerCache } from './entityPickerCache';

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

// customId: pa_invite_accept:{setupId}:{teamIndex}:{entityId}
export async function handlePaInviteAccept(interaction: ButtonInteraction): Promise<void> {
    const parts     = interaction.customId.split(':');
    const setupId   = parts[1];
    const teamIndex = parseInt(parts[2], 10);
    const entityId  = parseInt(parts[3], 10);

    const setup  = getSetup(setupId);
    const invite = setup?.pendingInvites.find(i => i.entityId === entityId);

    // Only the invited entity's owner may respond
    if (!invite || interaction.user.id !== invite.targetUserId) {
        await interaction.deferUpdate(); return;
    }

    await interaction.deferUpdate();

    // Delete the invite message
    await interaction.message.delete().catch(() => null);

    const channel = interaction.channel as TextChannel;

    // User already has a character in the session — auto-reject
    if (isUserInAnyTeam(setupId, interaction.user.id)) {
        resolvePendingInvite(setupId, entityId);
        await channel.send({
            components: [{
                type:         17,
                accent_color: colors.error,
                components:   [{ type: 10, content: `-# **${invite.entityName}**'s invite was auto-declined — you already have a character in this session.` }],
            }],
        } as never).then(msg => setTimeout(() => msg.delete().catch(() => null), 8_000));
        await refreshControlMessage(channel, setup);
        return;
    }

    resolvePendingInvite(setupId, entityId);
    const added = addEntityToTeam(setupId, teamIndex, {
        entityId:   entityId,
        entityName: invite.entityName,
        userId:     invite.targetUserId,
    });

    if (!added) {
        await channel.send({
            components: [{
                type:         17,
                accent_color: colors.error,
                components:   [{ type: 10, content: `-# **${invite.entityName}** could not be added — the team may be full.` }],
            }],
        } as never).then(msg => setTimeout(() => msg.delete().catch(() => null), 8_000));
        return;
    }

    invalidatePickerCache(setupId);
    await refreshTeamMessage(channel, setup!, teamIndex);
    await refreshControlMessage(channel, setup!);
}

// customId: pa_invite_reject:{setupId}:{entityId}
export async function handlePaInviteReject(interaction: ButtonInteraction): Promise<void> {
    const parts    = interaction.customId.split(':');
    const setupId  = parts[1];
    const entityId = parseInt(parts[2], 10);

    const setup  = getSetup(setupId);
    const invite = setup?.pendingInvites.find(i => i.entityId === entityId);

    if (!invite || interaction.user.id !== invite.targetUserId) {
        await interaction.deferUpdate(); return;
    }

    await interaction.deferUpdate();
    await interaction.message.delete().catch(() => null);

    resolvePendingInvite(setupId, entityId);

    const channel = interaction.channel as TextChannel;
    await refreshControlMessage(channel, setup!);
}
