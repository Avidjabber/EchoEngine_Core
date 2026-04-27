import { ButtonInteraction, MessageFlags, TextChannel, ThreadChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { messages } from '@echoengine/shared';
import {
    fetchAvailableActions, fetchParticipants, processAction, processBuiltinAction,
    type AvailableAction, type CombatParticipantInfo,
} from '../../../../../services/play/combatService';
import {
    buildActionPickerComponents,
    buildTargetPickerComponents,
    buildActionConfirmComponents,
    buildActionResultComponents,
    buildBuiltinTargetPickerComponents,
    buildBuiltinConfirmComponents,
} from './combatActionComponents';
import { getTurnEntry, markTurnFlagUsed, TURN_FLAG_MAIN, TURN_FLAG_BONUS, TURN_FLAG_ITEM } from './combatTurnState';
import { buildTurnPromptComponents, buildTurnAwaitingReactionComponents } from './combatTurnComponents';
import { setReactionEntry } from './combatReactionState';
import { buildReactionPromptComponents } from './combatReactionComponents';

const FLAG_BY_SLOT     = [TURN_FLAG_MAIN, TURN_FLAG_BONUS, TURN_FLAG_ITEM] as const;
const CATEGORY_BY_SLOT = ['main', 'bonus', 'item'] as const;

function errEphemeral(interaction: ButtonInteraction, content: string) {
    return interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content }] }],
    } as never);
}

// customId: pa_cbt_pick:{activeCombatId}:{entityId}:{profileId}:{storedItemId}:{catSlot}
export async function handlePaCbtPick(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);
    const profileId      = parseInt(parts[3], 10);
    const storedItemId   = parseInt(parts[4], 10);
    const catSlot        = parseInt(parts[5], 10) as 0 | 1 | 2;

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.userId !== interaction.user.id) return;

    const [actionsResult, participantsResult] = await Promise.all([
        fetchAvailableActions(activeCombatId, entityId, CATEGORY_BY_SLOT[catSlot]),
        fetchParticipants(activeCombatId),
    ]);

    if (!actionsResult.success || !participantsResult.success) {
        await errEphemeral(interaction, messages.errorGeneric);
        return;
    }

    const actions  = (actionsResult.value ?? []) as AvailableAction[];
    const allParts = (participantsResult.value ?? []) as CombatParticipantInfo[];
    const action   = actions.find(a => a.profileId === profileId && a.storedItemId === storedItemId);
    const actor    = allParts.find(p => p.entityId === entityId);

    if (!action || !actor) {
        await errEphemeral(interaction, 'That action is no longer available.');
        return;
    }

    const scope       = action.targetScope;
    const actionLabel = action.actionLabel ?? action.itemName;

    // Self-only: skip target picker, go straight to confirm
    if (scope?.targetsSelf && !scope.targetsSingle && !scope.targetsAllies && !scope.targetsEnemies) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: buildActionConfirmComponents(activeCombatId, entityId, profileId, storedItemId, catSlot, actionLabel, entityId, actor.name) as never,
        });
        return;
    }

    const eligible = allParts.filter(p => {
        if (p.isDefeated || p.hasFled) return false;
        const isSelf  = p.entityId === entityId;
        const isAlly  = p.allyFactionId === actor.allyFactionId;
        if (!scope) return true;
        if (isSelf && scope.targetsSelf)     return true;
        if (isAlly && scope.targetsAllies)   return true;
        if (!isAlly && scope.targetsEnemies) return true;
        return false;
    });

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildTargetPickerComponents(
            activeCombatId, entityId, profileId, storedItemId, catSlot,
            eligible, actor.allyFactionId, actionLabel, !!(scope?.targetsEnemies),
        ) as never,
    });
}

// customId: pa_cbt_target:{activeCombatId}:{entityId}:{profileId}:{storedItemId}:{catSlot}:{targetEntityId}
export async function handlePaCbtTarget(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);
    const profileId      = parseInt(parts[3], 10);
    const storedItemId   = parseInt(parts[4], 10);
    const catSlot        = parseInt(parts[5], 10) as 0 | 1 | 2;
    const targetEntityId = parseInt(parts[6], 10);

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.userId !== interaction.user.id) return;

    const [actionsResult, participantsResult] = await Promise.all([
        fetchAvailableActions(activeCombatId, entityId, CATEGORY_BY_SLOT[catSlot]),
        fetchParticipants(activeCombatId),
    ]);

    if (!actionsResult.success || !participantsResult.success) {
        await errEphemeral(interaction, messages.errorGeneric);
        return;
    }

    const actions  = (actionsResult.value ?? []) as AvailableAction[];
    const allParts = (participantsResult.value ?? []) as CombatParticipantInfo[];
    const action   = actions.find(a => a.profileId === profileId && a.storedItemId === storedItemId);
    const target   = allParts.find(p => p.entityId === targetEntityId);

    if (!action || !target) {
        await errEphemeral(interaction, 'That action or target is no longer available.');
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildActionConfirmComponents(
            activeCombatId, entityId, profileId, storedItemId, catSlot,
            action.actionLabel ?? action.itemName, targetEntityId, target.name,
        ) as never,
    });
}

// customId: pa_cbt_confirm:{activeCombatId}:{entityId}:{profileId}:{storedItemId}:{catSlot}:{targetEntityId}
export async function handlePaCbtConfirm(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);
    const profileId      = parseInt(parts[3], 10);
    const storedItemId   = parseInt(parts[4], 10);
    const catSlot        = parseInt(parts[5], 10) as 0 | 1 | 2;
    const targetEntityId = parseInt(parts[6], 10);

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.userId !== interaction.user.id) return;

    // Process the action (resolve dice, apply HP, set up behavior effects)
    const result = await processAction(activeCombatId, entityId, profileId, storedItemId, targetEntityId, entry.round);

    const channel = interaction.channel as TextChannel | ThreadChannel;
    const turnMsg = await channel.messages.fetch(entry.turnPromptMessageId).catch(() => null);

    if (result.success && result.value) {
        // Normalise: single-target returns ActionResult, AoE returns ActionResult[].
        const results = Array.isArray(result.value) ? result.value : [result.value];
        const primary  = results[0]!;

        // Mark the category only on success so a server-side abort doesn't consume the slot.
        markTurnFlagUsed(activeCombatId, FLAG_BY_SLOT[catSlot]);
        // Post each result publicly (one message per AoE target).
        for (const r of results) {
            await channel.send({
                components: buildActionResultComponents(r) as never,
            } as never).catch(() => null);
        }

        // AoE actions never produce reactions (suppressed server-side), so pendingReaction is
        // only meaningful on single-target results. Either way, read from primary.
        const reaction = primary.pendingReaction;
        if (reaction) {
            // Send the reaction prompt FIRST — only freeze the turn prompt once we know the
            // reaction message was successfully posted. If the send fails (e.g. component
            // overflow, rate limit), we fall through and leave the turn prompt interactive so
            // the attacker is not deadlocked.
            const reactionMsg = await channel.send({
                components: buildReactionPromptComponents(
                    activeCombatId, reaction.defenderEntityId, reaction.defenderEntityName,
                    reaction.defenderUserId ?? undefined, reaction.reactionProfiles,
                ) as never,
            }).catch(() => null);
            if (reactionMsg) {
                setReactionEntry(
                    activeCombatId, reactionMsg.id, channel.id,
                    reaction.defenderEntityId, reaction.defenderEntityName, reaction.defenderUserId ?? undefined,
                    reaction.attackerEntityId, reaction.reactionProfiles,
                );
                // Disable turn prompt only after the reaction prompt is confirmed live.
                if (turnMsg) {
                    await turnMsg.edit({
                        components: buildTurnAwaitingReactionComponents(entry.entityName, reaction.defenderEntityName) as never,
                    }).catch(() => null);
                }
            }
        } else {
            // No reaction — just update turn prompt with disabled action slot
            if (turnMsg) {
                await turnMsg.edit({
                    components: buildTurnPromptComponents(
                        activeCombatId, entry.entityId, entry.entityName, entry.userId,
                        entry.round, entry.usedFlags, entry.allowsFleeing,
                    ) as never,
                }).catch(() => null);
            }
        }

        // Acknowledge ephemeral
        const actionLabel = primary.actionLabel;
        const targetName  = primary.wasRedirected ? primary.actualTargetName : primary.targetName;
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.success, components: [{ type: 10, content: `**${actionLabel}** → **${targetName}** — done!` }] }],
        } as never);
    } else {
        // Error — still restore turn prompt
        if (turnMsg) {
            await turnMsg.edit({
                components: buildTurnPromptComponents(
                    activeCombatId, entry.entityId, entry.entityName, entry.userId,
                    entry.round, entry.usedFlags, entry.allowsFleeing,
                ) as never,
            }).catch(() => null);
        }
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }],
        } as never);
    }
}

// customId: pa_cbt_back:{activeCombatId}:{entityId}:{catSlot}
export async function handlePaCbtBack(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);
    const catSlot        = parseInt(parts[3], 10) as 0 | 1 | 2;

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.userId !== interaction.user.id) return;

    const result = await fetchAvailableActions(activeCombatId, entityId, CATEGORY_BY_SLOT[catSlot]);
    if (!result.success) {
        await errEphemeral(interaction, messages.errorGeneric);
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildActionPickerComponents(result.value ?? [], activeCombatId, entityId, CATEGORY_BY_SLOT[catSlot]) as never,
    });
}

// customId: pa_cbt_cancel:{activeCombatId}
export async function handlePaCbtCancel(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    await interaction.deleteReply().catch(() => null);
}

// customId: pa_cbt_builtin:{activeCombatId}:{entityId}:{builtinAction}:{catSlot}
export async function handlePaCbtBuiltin(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);
    const builtinAction  = parts[3] as 'dodge' | 'help';
    const catSlot        = parseInt(parts[4], 10) as 0 | 1 | 2;

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.userId !== interaction.user.id) return;

    if (builtinAction === 'dodge') {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: buildBuiltinConfirmComponents(activeCombatId, entityId, 'dodge', catSlot, entityId, entry.entityName) as never,
        });
        return;
    }

    // Help: show target picker (includes unconscious entities so you can assist with death saves)
    const participantsResult = await fetchParticipants(activeCombatId);
    if (!participantsResult.success) { await errEphemeral(interaction, messages.errorGeneric); return; }

    const allParts = participantsResult.value ?? [];
    const actor    = allParts.find(p => p.entityId === entityId);
    if (!actor) { await errEphemeral(interaction, messages.errorGeneric); return; }

    const eligible = allParts.filter(p => !p.isDefeated && !p.hasFled && p.entityId !== entityId);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildBuiltinTargetPickerComponents(activeCombatId, entityId, 'help', catSlot, eligible, actor.allyFactionId) as never,
    });
}

// customId: pa_cbt_builtin_t:{activeCombatId}:{entityId}:{builtinAction}:{catSlot}:{targetEntityId}
export async function handlePaCbtBuiltinTarget(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);
    const builtinAction  = parts[3] as 'dodge' | 'help';
    const catSlot        = parseInt(parts[4], 10) as 0 | 1 | 2;
    const targetEntityId = parseInt(parts[5], 10);

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.userId !== interaction.user.id) return;

    const participantsResult = await fetchParticipants(activeCombatId);
    if (!participantsResult.success) { await errEphemeral(interaction, messages.errorGeneric); return; }

    const target = (participantsResult.value ?? []).find(p => p.entityId === targetEntityId);
    if (!target) { await errEphemeral(interaction, 'That target is no longer available.'); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildBuiltinConfirmComponents(activeCombatId, entityId, builtinAction, catSlot, targetEntityId, target.name) as never,
    });
}

// customId: pa_cbt_builtin_ok:{activeCombatId}:{entityId}:{builtinAction}:{catSlot}:{targetEntityId}
export async function handlePaCbtBuiltinOk(interaction: ButtonInteraction): Promise<void> {
    const parts          = interaction.customId.split(':');
    const activeCombatId = parseInt(parts[1], 10);
    const entityId       = parseInt(parts[2], 10);
    const builtinAction  = parts[3] as 'dodge' | 'help';
    const catSlot        = parseInt(parts[4], 10) as 0 | 1 | 2;
    const targetEntityId = parseInt(parts[5], 10);

    await interaction.deferUpdate();

    const entry = getTurnEntry(activeCombatId);
    if (!entry || entry.userId !== interaction.user.id) return;

    const targetId = builtinAction === 'dodge' ? null : targetEntityId;
    const result   = await processBuiltinAction(activeCombatId, entityId, builtinAction, targetId, entry.round);
    const channel  = interaction.channel as TextChannel | ThreadChannel;
    const turnMsg  = await channel.messages.fetch(entry.turnPromptMessageId).catch(() => null);

    if (result.success && result.value) {
        markTurnFlagUsed(activeCombatId, FLAG_BY_SLOT[catSlot]);
        await channel.send({
            components: buildActionResultComponents(result.value) as never,
        } as never).catch(() => null);
        if (turnMsg) {
            await turnMsg.edit({
                components: buildTurnPromptComponents(
                    activeCombatId, entry.entityId, entry.entityName, entry.userId,
                    entry.round, entry.usedFlags, entry.allowsFleeing,
                ) as never,
            }).catch(() => null);
        }
        const label = result.value.actionLabel;
        const tgt   = result.value.targetName !== result.value.actorName ? ` → **${result.value.targetName}**` : '';
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.success, components: [{ type: 10, content: `**${label}**${tgt} — done!` }] }],
        } as never);
    } else {
        if (turnMsg) {
            await turnMsg.edit({
                components: buildTurnPromptComponents(
                    activeCombatId, entry.entityId, entry.entityName, entry.userId,
                    entry.round, entry.usedFlags, entry.allowsFleeing,
                ) as never,
            }).catch(() => null);
        }
        await errEphemeral(interaction, messages.errorGeneric);
    }
}
