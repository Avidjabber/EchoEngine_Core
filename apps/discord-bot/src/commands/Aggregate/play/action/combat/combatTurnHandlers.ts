import { ButtonInteraction, MessageFlags, TextChannel, ThreadChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { messages } from '@echoengine/shared';
import { fetchAvailableActions, advanceTurn } from '../../../../../services/play/combatService';
import { buildActionPickerComponents } from './combatActionComponents';
import { buildTurnPromptComponents, buildTurnEndedComponents } from './combatTurnComponents';
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

    // Replace turn prompt buttons with "turn ended" text
    await interaction.message.edit({
        components: buildTurnEndedComponents(entry.entityName) as never,
    }).catch(() => null);

    const channel = interaction.channel as TextChannel | ThreadChannel;

    const result = await advanceTurn(activeCombatId, entityId);
    if (!result.success || !result.value) {
        await channel.send({
            components: [{
                type:         17,
                accent_color: colors.error,
                components:   [{ type: 10, content: messages.errorGeneric }],
            }],
        } as never).catch(() => null);
        return;
    }

    const advance = result.value;

    if (advance.combatEnded) {
        deleteTurnEntry(activeCombatId);
        const outcomeText = advance.winningAllyFactionId !== null
            ? `Team ${advance.winningAllyFactionId} wins!`
            : 'The combat has ended in a draw.';
        await channel.send({
            components: [{
                type:         17,
                accent_color: colors.special,
                components:   [
                    { type: 10, content: `## ⚔ Combat Over` },
                    { type: 14 },
                    { type: 10, content: outcomeText },
                ],
            }],
        } as never).catch(() => null);
        return;
    }

    // Skip consecutive AI participants, each auto-passes publicly
    let current = advance;
    while (current.isAiControlled && !current.combatEnded) {
        await channel.send({
            components: [{
                type:         17,
                accent_color: colors.info,
                components:   [{ type: 10, content: `-# **${current.nextEntityName}** passes their turn.` }],
            }],
        } as never).catch(() => null);

        const skipResult = await advanceTurn(activeCombatId, current.nextEntityId!);
        if (!skipResult.success || !skipResult.value) {
            deleteTurnEntry(activeCombatId);
            return;
        }
        current = skipResult.value;
    }

    if (current.combatEnded) {
        deleteTurnEntry(activeCombatId);
        const outcomeText = current.winningAllyFactionId !== null
            ? `Team ${current.winningAllyFactionId} wins!`
            : 'The combat has ended in a draw.';
        await channel.send({
            components: [{
                type:         17,
                accent_color: colors.special,
                components:   [
                    { type: 10, content: `## ⚔ Combat Over` },
                    { type: 14 },
                    { type: 10, content: outcomeText },
                ],
            }],
        } as never).catch(() => null);
        return;
    }

    return postNextTurnPrompt(channel, activeCombatId, current.nextEntityId!, current.nextEntityName!, current.nextUserId, current.round);
}

async function postNextTurnPrompt(
    channel:       TextChannel | ThreadChannel,
    activeCombatId: number,
    nextEntityId:  number,
    nextEntityName: string,
    nextUserId:    string | null,
    round:         number,
): Promise<void> {
    const msg = await channel.send({
        components: buildTurnPromptComponents(
            activeCombatId, nextEntityId, nextEntityName, nextUserId ?? undefined, round, 0,
        ) as never,
    });

    setTurnEntry(activeCombatId, msg.id, channel.id, nextEntityId, nextEntityName, nextUserId ?? undefined, round);
}
