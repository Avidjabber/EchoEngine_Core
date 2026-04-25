import { ButtonInteraction, MessageFlags, TextChannel, ThreadChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { messages } from '@echoengine/shared';
import { fetchAvailableActions, advanceTurn, distributeCombatXp, acceptSecondWind, declineSecondWind } from '../../../../../services/play/combatService';
import type { AdvanceTurnResult } from '../../../../../services/play/combatService';
import { buildActionPickerComponents } from './combatActionComponents';
import { buildTurnPromptComponents, buildTurnEndedComponents, buildSecondWindComponents, buildCombatOutcomeComponents } from './combatTurnComponents';
import { getTurnEntry, setTurnEntry, deleteTurnEntry } from './combatTurnState';

function errEphemeral(interaction: ButtonInteraction, content: string) {
    return interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content }] }],
    } as never);
}

async function handleTurnAction(
    interaction: ButtonInteraction,
    category:   'main' | 'bonus' | 'item',
): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.entityId !== entityId || entry.userId !== interaction.user.id) {
        await errEphemeral(interaction, "It's not your turn.");
        return;
    }

    const result = await fetchAvailableActions(activeCombatId, entityId, category);
    if (!result.success) {
        await errEphemeral(interaction, messages.errorGeneric);
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildActionPickerComponents(result.value ?? [], activeCombatId, entityId, category) as never,
    });
}

// customId: pa_turn_main:{activeCombatId}:{entityId}
export async function handlePaTurnMain(interaction: ButtonInteraction): Promise<void> {
    await handleTurnAction(interaction, 'main');
}

// customId: pa_turn_bonus:{activeCombatId}:{entityId}
export async function handlePaTurnBonus(interaction: ButtonInteraction): Promise<void> {
    await handleTurnAction(interaction, 'bonus');
}

// customId: pa_turn_item:{activeCombatId}:{entityId}
export async function handlePaTurnItem(interaction: ButtonInteraction): Promise<void> {
    await handleTurnAction(interaction, 'item');
}

// customId: pa_turn_end:{activeCombatId}:{entityId}
export async function handlePaTurnEnd(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.entityId !== entityId || entry.userId !== interaction.user.id) return;

    await interaction.message.edit({
        components: buildTurnEndedComponents(entry.entityName) as never,
    }).catch(() => null);

    const channel = interaction.channel as TextChannel | ThreadChannel;
    const result  = await advanceTurn(activeCombatId, entityId);
    if (!result.success || !result.value) {
        await channel.send({
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }],
        } as never).catch(() => null);
        return;
    }

    await processAdvanceResult(channel, activeCombatId, result.value);
}

// customId: pa_sw_accept:{activeCombatId}:{entityId}
export async function handlePaSwAccept(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.entityId !== entityId || entry.userId !== interaction.user.id) return;

    await acceptSecondWind(activeCombatId, entityId).catch(() => null);

    await interaction.message.edit({
        components: [{
            type:         17,
            accent_color: colors.warning,
            components:   [{ type: 10, content: `-# **${entry.entityName}** accepted second wind — HP restored. Fall again and you're out.` }],
        }],
    } as never).catch(() => null);

    const channel = interaction.channel as TextChannel | ThreadChannel;
    await postNextTurnPrompt(channel, activeCombatId, entityId, entry.entityName, entry.userId ?? null, entry.round);
}

// customId: pa_sw_decline:{activeCombatId}:{entityId}
export async function handlePaSwDecline(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.entityId !== entityId || entry.userId !== interaction.user.id) return;

    await declineSecondWind(activeCombatId, entityId).catch(() => null);

    await interaction.message.edit({
        components: [{
            type:         17,
            accent_color: colors.info,
            components:   [{ type: 10, content: `-# **${entry.entityName}** has been eliminated.` }],
        }],
    } as never).catch(() => null);

    const channel = interaction.channel as TextChannel | ThreadChannel;
    const result  = await advanceTurn(activeCombatId, entityId);
    if (!result.success || !result.value) {
        deleteTurnEntry(activeCombatId);
        return;
    }

    await processAdvanceResult(channel, activeCombatId, result.value);
}

async function processAdvanceResult(
    channel:        TextChannel | ThreadChannel,
    activeCombatId: number,
    advance:        AdvanceTurnResult,
): Promise<void> {
    if (advance.combatEnded) {
        deleteTurnEntry(activeCombatId);
        await postCombatOutcome(channel, activeCombatId, advance.winningAllyFactionId);
        return;
    }

    let current = advance;
    while (current.isAiControlled && !current.combatEnded) {
        await channel.send({
            components: [{ type: 17, accent_color: colors.info, components: [{ type: 10, content: `-# **${current.nextEntityName}** passes their turn.` }] }],
        } as never).catch(() => null);

        const skipResult = await advanceTurn(activeCombatId, current.nextEntityId!);
        if (!skipResult.success || !skipResult.value) { deleteTurnEntry(activeCombatId); return; }
        current = skipResult.value;
    }

    if (current.combatEnded) {
        deleteTurnEntry(activeCombatId);
        await postCombatOutcome(channel, activeCombatId, current.winningAllyFactionId);
        return;
    }

    if (current.isAwaitingSecondWind) {
        return postSecondWindPrompt(channel, activeCombatId, current.nextEntityId!, current.nextEntityName!, current.nextUserId, current.round);
    }

    return postNextTurnPrompt(channel, activeCombatId, current.nextEntityId!, current.nextEntityName!, current.nextUserId, current.round);
}

async function postNextTurnPrompt(
    channel:        TextChannel | ThreadChannel,
    activeCombatId: number,
    nextEntityId:   number,
    nextEntityName: string,
    nextUserId:     string | null,
    round:          number,
): Promise<void> {
    const msg = await channel.send({
        components: buildTurnPromptComponents(activeCombatId, nextEntityId, nextEntityName, nextUserId ?? undefined, round, 0) as never,
    });
    setTurnEntry(activeCombatId, msg.id, channel.id, nextEntityId, nextEntityName, nextUserId ?? undefined, round);
}

async function postSecondWindPrompt(
    channel:        TextChannel | ThreadChannel,
    activeCombatId: number,
    entityId:       number,
    entityName:     string,
    userId:         string | null,
    round:          number,
): Promise<void> {
    const msg = await channel.send({
        components: buildSecondWindComponents(activeCombatId, entityId, entityName, userId ?? undefined, round) as never,
    });
    setTurnEntry(activeCombatId, msg.id, channel.id, entityId, entityName, userId ?? undefined, round);
}

async function postCombatOutcome(
    channel:              TextChannel | ThreadChannel,
    activeCombatId:       number,
    winningAllyFactionId: number | null,
): Promise<void> {
    const xpResult = await distributeCombatXp(activeCombatId).catch(() => null);
    const xpGrants = xpResult?.success ? (xpResult.value ?? []) : [];
    await channel.send({
        components: buildCombatOutcomeComponents(winningAllyFactionId, xpGrants) as never,
    }).catch(() => null);
}
