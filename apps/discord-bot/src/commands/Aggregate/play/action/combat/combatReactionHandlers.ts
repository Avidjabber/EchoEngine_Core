import { ButtonInteraction, TextChannel, ThreadChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { processReaction } from '../../../../../services/play/combatService';
import { buildActionResultComponents } from './combatActionComponents';
import { buildTurnPromptComponents } from './combatTurnComponents';
import { getTurnEntry } from './combatTurnState';
import { getReactionEntry, deleteReactionEntry } from './combatReactionState';

async function restoreTurnPrompt(interaction: ButtonInteraction, activeCombatId: number): Promise<void> {
    const entry = getTurnEntry(activeCombatId);
    if (!entry) return;
    const channel = await interaction.client.channels.fetch(entry.channelId).catch(() => null) as TextChannel | ThreadChannel | null;
    if (!channel) return;
    const turnMsg = await channel.messages.fetch(entry.turnPromptMessageId).catch(() => null);
    if (turnMsg) {
        await turnMsg.edit({
            components: buildTurnPromptComponents(
                activeCombatId, entry.entityId, entry.entityName, entry.userId,
                entry.round, entry.usedFlags, entry.allowsFleeing,
            ) as never,
        }).catch(() => null);
    }
}

// customId: pa_react_use:{activeCombatId}:{defenderEntityId}:{profileId}:{storedItemId}
export async function handlePaReactUse(interaction: ButtonInteraction): Promise<void> {
    const parts            = interaction.customId.split(':');
    const activeCombatId   = parseInt(parts[1], 10);
    const defenderEntityId = parseInt(parts[2], 10);
    const profileId        = parseInt(parts[3], 10);
    const storedItemId     = parseInt(parts[4], 10);

    await interaction.deferUpdate();

    const reactionEntry = getReactionEntry(activeCombatId);
    if (!reactionEntry || reactionEntry.defenderEntityId !== defenderEntityId) return;
    if (reactionEntry.defenderUserId && reactionEntry.defenderUserId !== interaction.user.id) return;

    const roundNumber = getTurnEntry(activeCombatId)?.round ?? 1;

    const result = await processReaction(
        activeCombatId, defenderEntityId, profileId, storedItemId,
        reactionEntry.attackerEntityId, roundNumber,
    ).catch(() => null);

    const channel = interaction.channel as TextChannel | ThreadChannel;

    if (result?.success && result.value) {
        await channel.send({
            components: buildActionResultComponents(result.value) as never,
        } as never).catch(() => null);
    }

    await interaction.message.edit({
        components: [{
            type:         17,
            accent_color: colors.warning,
            components:   [{ type: 10, content: `-# **${reactionEntry.defenderEntityName}** used their reaction.` }],
        }],
    } as never).catch(() => null);

    deleteReactionEntry(activeCombatId);
    await restoreTurnPrompt(interaction, activeCombatId);
}

// customId: pa_react_skip:{activeCombatId}:{defenderEntityId}
export async function handlePaReactSkip(interaction: ButtonInteraction): Promise<void> {
    const parts            = interaction.customId.split(':');
    const activeCombatId   = parseInt(parts[1], 10);
    const defenderEntityId = parseInt(parts[2], 10);

    await interaction.deferUpdate();

    const reactionEntry = getReactionEntry(activeCombatId);
    if (!reactionEntry || reactionEntry.defenderEntityId !== defenderEntityId) return;
    if (reactionEntry.defenderUserId && reactionEntry.defenderUserId !== interaction.user.id) return;

    await interaction.message.edit({
        components: [{
            type:         17,
            accent_color: colors.info,
            components:   [{ type: 10, content: `-# **${reactionEntry.defenderEntityName}** chose not to react.` }],
        }],
    } as never).catch(() => null);

    deleteReactionEntry(activeCombatId);
    await restoreTurnPrompt(interaction, activeCombatId);
}
