import { ButtonInteraction, MessageFlags, PermissionFlagsBits, TextChannel, ThreadChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { messages } from '@echoengine/shared';
import { fetchAvailableActions, advanceTurn, distributeCombatXp, markDeceased, flee } from '../../../../../services/play/combatService';
import type { AdvanceTurnResult, DeathSaveEvent, MortallyWoundedCharacter, RoundEndEvent } from '../../../../../services/play/combatService';
import { buildActionPickerComponents } from './combatActionComponents';
import { buildTurnPromptComponents, buildTurnEndedComponents, buildDeceasedPromptComponents, buildDeceasedResolvedComponents, buildCombatOutcomeComponents } from './combatTurnComponents';
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

// customId: pa_turn_flee:{activeCombatId}:{entityId}
export async function handlePaTurnFlee(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.entityId !== entityId || entry.userId !== interaction.user.id) return;
    if (!entry.allowsFleeing) return;

    const fleeResult = await flee(activeCombatId, entityId).catch(() => null);
    if (!fleeResult?.success || !fleeResult.value?.allowed) return;

    await interaction.message.edit({
        components: [{
            type:         17,
            accent_color: colors.warning,
            components:   [{ type: 10, content: `-# **${entry.entityName}** has fled the battle.` }],
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

// customId: pa_deceased_mark:{activeCombatId}:{entityId}
export async function handlePaDeceasedMark(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return;

    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);

    await interaction.deferUpdate();

    // Best-effort: parse the entity name from the message text so the confirmation is specific.
    const originalText = (interaction.message.components as unknown as Array<{ components: Array<{ content?: string }> }>)
        ?.[0]?.components?.[0]?.content ?? '';
    const nameMatch    = originalText.match(/^\*\*(.+?)\*\*/);
    const entityName   = nameMatch?.[1] ?? 'The character';

    await markDeceased(activeCombatId, entityId).catch(() => null);

    await interaction.message.edit({
        components: buildDeceasedResolvedComponents(entityName, true) as never,
    }).catch(() => null);
}

// customId: pa_deceased_spare:{activeCombatId}:{entityId}
export async function handlePaDeceasedSpare(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return;

    const parts    = interaction.customId.split(':');
    const entityName_unused = parts[2]; // entityId not needed — spare is the default state
    void entityName_unused;

    await interaction.deferUpdate();

    const originalText = (interaction.message.components as unknown as Array<{ components: Array<{ content?: string }> }>)
        ?.[0]?.components?.[0]?.content ?? '';
    const nameMatch    = originalText.match(/^\*\*(.+?)\*\*/);
    const entityName   = nameMatch?.[1] ?? 'The character';

    await interaction.message.edit({
        components: buildDeceasedResolvedComponents(entityName, false) as never,
    }).catch(() => null);
}

async function postTurnEndEvents(
    channel: TextChannel | ThreadChannel,
    events:  RoundEndEvent[],
): Promise<void> {
    if (events.length === 0) return;
    const lines = events.map(e => {
        if (e.kind === 'dot') {
            if (e.defeated)    return `-# **${e.entityName}** takes ${e.amount} damage and is defeated.`;
            if (e.knockedDown) return `-# **${e.entityName}** takes ${e.amount} damage and falls unconscious — death saves begin on their next turn.`;
            return `-# **${e.entityName}** takes ${e.amount} damage (${e.hpAfter} HP remaining).`;
        }
        return `-# **${e.entityName}** heals for ${e.amount} (${e.hpAfter} HP remaining).`;
    });
    await channel.send({
        components: [{ type: 17, accent_color: colors.warning, components: [{ type: 10, content: lines.join('\n') }] }],
    } as never).catch(() => null);
}

async function postDeathSaveResult(
    channel: TextChannel | ThreadChannel,
    event:   DeathSaveEvent,
): Promise<void> {
    let text: string;
    switch (event.result) {
        case 'revived':
            text = `🎲 **${event.entityName}** rolled a **natural 20** on their death save — they spring back up at 1 HP!`;
            break;
        case 'stable':
            text = `🎲 **${event.entityName}** rolled **${event.roll}** — third success. They stabilise and are no longer in danger.`;
            break;
        case 'defeated':
            text = `🎲 **${event.entityName}** rolled **${event.roll}**${event.roll === 1 ? ' (natural 1 — two failures)' : ''} — ${event.failures >= 3 ? 'three failures. They have succumbed to their wounds.' : 'defeated.'}`;
            break;
        case 'success':
            text = `🎲 **${event.entityName}** rolled **${event.roll}** — success. (${event.successes}/3 successes, ${event.failures}/3 failures)`;
            break;
        case 'failure':
            text = `🎲 **${event.entityName}** rolled **${event.roll}**${event.roll === 1 ? ' (natural 1 — two failures)' : ''} — failure. (${event.successes}/3 successes, ${event.failures}/3 failures)`;
            break;
    }
    const accentColor = event.result === 'revived' ? colors.special
        : event.result === 'defeated' ? colors.error
        : event.result === 'stable'   ? colors.info
        : event.result === 'success'  ? colors.success
        : colors.warning;
    await channel.send({
        components: [{ type: 17, accent_color: accentColor, components: [{ type: 10, content: text }] }],
    } as never).catch(() => null);
}

async function postDeceasedPrompts(
    channel:         TextChannel | ThreadChannel,
    activeCombatId:  number,
    mortallyWounded: MortallyWoundedCharacter[],
): Promise<void> {
    for (const char of mortallyWounded) {
        await channel.send({
            components: buildDeceasedPromptComponents(activeCombatId, char.entityId, char.name, char.userId) as never,
        }).catch(() => null);
    }
}

async function processAdvanceResult(
    channel:        TextChannel | ThreadChannel,
    activeCombatId: number,
    advance:        AdvanceTurnResult,
): Promise<void> {
    if (advance.combatEnded) {
        deleteTurnEntry(activeCombatId);
        await postTurnEndEvents(channel, advance.turnEndEvents);
        await postCombatOutcome(channel, activeCombatId, advance.winningAllyFactionId);
        await postDeceasedPrompts(channel, activeCombatId, advance.mortallyWounded);
        return;
    }

    await postTurnEndEvents(channel, advance.turnEndEvents);
    if (advance.deathSaveEvent) await postDeathSaveResult(channel, advance.deathSaveEvent);

    // Stage 1–3: AI entities pass their turns here. Stage 4 wires the NPC_AI pipeline phase
    // to replace this loop with actual action selection.
    // Safety ceiling prevents an infinite loop when all remaining participants are AI-controlled
    // (e.g. all players fled a mixed fight). Keeps this well above any realistic combat size.
    let current = advance;
    let aiPassCount = 0;
    const MAX_AI_PASSES = 50;
    while (current.isAiControlled && !current.combatEnded && aiPassCount < MAX_AI_PASSES) {
        aiPassCount++;
        await channel.send({
            components: [{ type: 17, accent_color: colors.info, components: [{ type: 10, content: `-# **${current.nextEntityName}** passes their turn.` }] }],
        } as never).catch(() => null);

        const skipResult = await advanceTurn(activeCombatId, current.nextEntityId!);
        if (!skipResult.success || !skipResult.value) { deleteTurnEntry(activeCombatId); return; }
        current = skipResult.value;
        await postTurnEndEvents(channel, current.turnEndEvents);
        if (current.deathSaveEvent) await postDeathSaveResult(channel, current.deathSaveEvent);
    }

    // If we hit the ceiling with only AI remaining, abandon the turn state rather than
    // posting a player prompt for an AI-controlled entity.
    if (current.isAiControlled && !current.combatEnded) {
        deleteTurnEntry(activeCombatId);
        await channel.send({
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: `-# Combat stalled — no eligible players to continue.` }] }],
        } as never).catch(() => null);
        return;
    }

    if (current.combatEnded) {
        deleteTurnEntry(activeCombatId);
        await postCombatOutcome(channel, activeCombatId, current.winningAllyFactionId);
        await postDeceasedPrompts(channel, activeCombatId, current.mortallyWounded);
        return;
    }

    return postNextTurnPrompt(channel, activeCombatId, current.nextEntityId!, current.nextEntityName!, current.nextUserId, current.round, current.allowsFleeing);
}

async function postNextTurnPrompt(
    channel:        TextChannel | ThreadChannel,
    activeCombatId: number,
    nextEntityId:   number,
    nextEntityName: string,
    nextUserId:     string | null,
    round:          number,
    allowsFleeing:  boolean,
): Promise<void> {
    const msg = await channel.send({
        components: buildTurnPromptComponents(activeCombatId, nextEntityId, nextEntityName, nextUserId ?? undefined, round, 0, allowsFleeing) as never,
    });
    setTurnEntry(activeCombatId, msg.id, channel.id, nextEntityId, nextEntityName, nextUserId ?? undefined, round, allowsFleeing);
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
