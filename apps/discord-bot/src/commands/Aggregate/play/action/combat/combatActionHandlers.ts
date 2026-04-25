import { ButtonInteraction, MessageFlags, TextChannel, ThreadChannel } from 'discord.js';
import { colors } from '../../../../../core/colors';
import { messages } from '@echoengine/shared';
import {
    fetchAvailableActions, fetchParticipants, processAction,
    type AvailableAction, type CombatParticipantInfo,
} from '../../../../../services/play/combatService';
import {
    buildActionPickerComponents,
    buildTargetPickerComponents,
    buildActionConfirmComponents,
    buildActionResultComponents,
} from './combatActionComponents';
import { getTurnEntry, markTurnFlagUsed, TURN_FLAG_MAIN, TURN_FLAG_BONUS, TURN_FLAG_ITEM } from './combatTurnState';
import { buildTurnPromptComponents } from './combatTurnComponents';

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
        if (p.currentHp !== null && p.currentHp <= 0) return false;
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

    // Mark this category as used
    const flag = FLAG_BY_SLOT[catSlot];
    markTurnFlagUsed(activeCombatId, flag);

    // Update the turn prompt buttons (disable the used one)
    const channel = interaction.channel as TextChannel | ThreadChannel;
    const turnMsg = await channel.messages.fetch(entry.turnPromptMessageId).catch(() => null);
    if (turnMsg) {
        await turnMsg.edit({
            components: buildTurnPromptComponents(
                activeCombatId, entry.entityId, entry.entityName, entry.userId, entry.round, entry.usedFlags,
            ) as never,
        }).catch(() => null);
    }

    if (result.success && result.value) {
        // Post real result publicly
        await channel.send({
            components: buildActionResultComponents(result.value) as never,
        } as never).catch(() => null);

        // Acknowledge ephemeral
        const actionLabel = result.value.actionLabel;
        const targetName  = result.value.wasRedirected ? result.value.actualTargetName : result.value.targetName;
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.success, components: [{ type: 10, content: `**${actionLabel}** → **${targetName}** — done!` }] }],
        } as never);
    } else {
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
