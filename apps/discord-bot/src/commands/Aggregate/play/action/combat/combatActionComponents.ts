import { colors } from '../../../../../core/colors';
import type { AvailableAction, CombatParticipantInfo, ActionResult } from '../../../../../services/play/combatService';

const CATEGORY_LABEL: Record<'main' | 'bonus' | 'item', string> = {
    main:  'Main Action',
    bonus: 'Bonus Action',
    item:  'Item Interaction',
};

function scopeLabel(scope: AvailableAction['targetScope']): string {
    if (!scope) return '';
    if (scope.targetsSelf) return 'Self';
    if (scope.targetsSingle) return 'Single';
    return 'Team';
}

function actionSummary(action: AvailableAction): string {
    const parts: string[] = [];
    const scope = scopeLabel(action.targetScope);
    if (scope) parts.push(`🎯 ${scope}`);
    if (action.damageDice) {
        const typeLabel = action.damageTypeName ? ` ${action.damageTypeName}` : '';
        parts.push(`⚔ ${action.damageDice}${typeLabel}`);
    }
    if (action.elementalDamageDice) {
        const typeLabel = action.elementalDamageTypeName ? ` ${action.elementalDamageTypeName}` : '';
        parts.push(`+${action.elementalDamageDice}${typeLabel}`);
    }
    if (action.healDice) parts.push(`💚 ${action.healDice}`);
    if (action.cooldownRounds > 0) parts.push(`⏳ ${action.cooldownRounds}r cooldown`);
    return parts.length ? ` — ${parts.join(', ')}` : '';
}

export function buildActionResultComponents(result: ActionResult): object[] {
    const { actorName, targetName, actualTargetName, wasRedirected, actionLabel, outcome, appliedEffects } = result;

    const redirectNote = wasRedirected ? ` → **${actualTargetName}** *(guard)*` : '';
    const header = `**${actorName}** used **${actionLabel}** on **${targetName}**${redirectNote}`;

    let body: string;
    let accentColor: number;

    if (outcome.kind === 'hit') {
        const hitLine = outcome.isCritical
            ? `⚔ Rolled **${outcome.hitRoll}** vs AC ${outcome.targetAC} — ✨ **Critical Hit!**`
            : `⚔ Rolled **${outcome.hitRoll}** vs AC ${outcome.targetAC} — **Hit!**`;

        const primaryType  = outcome.damageTypeName ?? 'damage';
        const primaryDice  = outcome.diceRolls.length > 0 ? ` (${outcome.diceRolls.join('+')})` : '';
        const primaryLine  = `💥 **${outcome.totalDamage} ${primaryType}**${primaryDice}`;

        const hasElemental = outcome.elementalDiceRolls.length > 0 && outcome.totalElementalDamage > 0;
        const elementalLine = hasElemental
            ? `\n🔥 **+${outcome.totalElementalDamage} ${outcome.elementalDamageTypeName ?? 'elemental'}** (${outcome.elementalDiceRolls.join('+')})`
            : '';

        const totalDamage    = outcome.totalDamage + outcome.totalElementalDamage;
        const totalLine      = hasElemental ? `\n**${totalDamage} total damage**` : '';

        body = `${hitLine}\n${primaryLine}${elementalLine}${totalLine}\n${actualTargetName} now at **${outcome.hpAfter} HP**`;
        if (outcome.defeated) {
            body += `\n-# 💀 ${actualTargetName} has been eliminated.`;
        } else if (outcome.knockedDown) {
            body += `\n-# 🟡 ${actualTargetName} is knocked down — awaiting second wind decision.`;
        }
        accentColor = colors.error;
    } else if (outcome.kind === 'miss') {
        body = `⚔ Rolled **${outcome.hitRoll}** vs AC ${outcome.targetAC} — **Miss!**`;
        accentColor = colors.info;
    } else if (outcome.kind === 'heal') {
        const diceStr = outcome.diceRolls.join('+');
        const diceExpr = outcome.diceRolls.length > 0 ? ` (${diceStr} = ${outcome.totalHeal})` : '';
        body = `💚 **${outcome.totalHeal} HP restored**${diceExpr}\n${actualTargetName} now at **${outcome.hpAfter} HP**`;
        accentColor = colors.success;
    } else if (outcome.kind === 'behavior') {
        const guardLine = outcome.guardedName ? ` — guarding **${outcome.guardedName}**` : '';
        body = `🛡 **${outcome.effectName}** active for **${outcome.rounds}** round${outcome.rounds !== 1 ? 's' : ''}${guardLine}`;
        accentColor = colors.info;
    } else {
        body = `${actorName} used ${actionLabel}.`;
        accentColor = colors.info;
    }

    if (appliedEffects.length > 0) {
        body += `\n-# ✦ ${appliedEffects.join(', ')}`;
    }

    return [{
        type:         17,
        accent_color: accentColor,
        components:   [{ type: 10, content: `${header}\n${body}` }],
    }];
}

export function buildActionPickerComponents(
    actions:       AvailableAction[],
    activeCombatId: number,
    entityId:      number,
    category:      'main' | 'bonus' | 'item',
): object[] {
    const header = `**${CATEGORY_LABEL[category]}** — choose an action:`;
    const catSlot = category === 'main' ? 0 : category === 'bonus' ? 1 : 2;

    if (actions.length === 0) {
        return [{
            type:         17,
            accent_color: colors.info,
            components:   [{ type: 10, content: `${header}\n\n-# No actions available for this slot.` }],
        }];
    }

    const rows: object[] = [];
    // Discord limits 5 buttons per action row; split if needed
    for (let i = 0; i < actions.length; i += 4) {
        const slice = actions.slice(i, i + 4);
        rows.push({
            type: 1,
            components: slice.map(a => ({
                type:      2,
                style:     a.isOnCooldown ? 2 : 1,
                label:     (a.actionLabel ?? a.itemName).slice(0, 80),
                custom_id: `pa_cbt_pick:${activeCombatId}:${entityId}:${a.profileId}:${a.storedItemId}:${catSlot}`,
                disabled:  a.isOnCooldown,
            })),
        });
    }

    const actionLines = actions
        .map(a => `**${a.actionLabel ?? a.itemName}**${actionSummary(a)}${a.isOnCooldown ? ' *(on cooldown)*' : ''}`)
        .join('\n');

    const cancelRow = {
        type: 1,
        components: [{ type: 2, style: 4, label: 'Cancel', custom_id: `pa_cbt_cancel:${activeCombatId}` }],
    };

    return [{
        type:         17,
        accent_color: colors.info,
        components: [
            { type: 10, content: `${header}\n\n${actionLines}` },
            { type: 14 },
            ...rows,
            cancelRow,
        ],
    }];
}

export function buildTargetPickerComponents(
    activeCombatId: number,
    entityId:       number,
    profileId:      number,
    storedItemId:   number,
    catSlot:        number,
    targets:        CombatParticipantInfo[],
    actorAllyFactionId: number,
    actionLabel:    string,
    isHarmful:      boolean,
): object[] {
    const header = `**${actionLabel}** — choose a target:`;

    const rows: object[] = [];
    for (let i = 0; i < targets.length; i += 4) {
        const slice = targets.slice(i, i + 4);
        rows.push({
            type: 1,
            components: slice.map(t => {
                const isEnemy = t.allyFactionId !== actorAllyFactionId;
                return {
                    type:      2,
                    style:     isEnemy ? 4 : 2,
                    label:     t.name.slice(0, 80),
                    custom_id: `pa_cbt_target:${activeCombatId}:${entityId}:${profileId}:${storedItemId}:${catSlot}:${t.entityId}`,
                };
            }),
        });
    }

    const backRow = {
        type: 1,
        components: [
            { type: 2, style: 2, label: '← Back',  custom_id: `pa_cbt_back:${activeCombatId}:${entityId}:${catSlot}` },
            { type: 2, style: 4, label: 'Cancel',  custom_id: `pa_cbt_cancel:${activeCombatId}` },
        ],
    };

    return [{
        type:         17,
        accent_color: colors.info,
        components: [
            { type: 10, content: header },
            { type: 14 },
            ...rows,
            backRow,
        ],
    }];
}

export function buildActionConfirmComponents(
    activeCombatId: number,
    entityId:       number,
    profileId:      number,
    storedItemId:   number,
    catSlot:        number,
    actionLabel:    string,
    targetEntityId: number,
    targetName:     string,
): object[] {
    return [{
        type:         17,
        accent_color: colors.info,
        components: [
            { type: 10, content: `**${actionLabel}** → **${targetName}**\nConfirm?` },
            { type: 14 },
            {
                type: 1,
                components: [
                    { type: 2, style: 1, label: 'Confirm', custom_id: `pa_cbt_confirm:${activeCombatId}:${entityId}:${profileId}:${storedItemId}:${catSlot}:${targetEntityId}` },
                    { type: 2, style: 2, label: '← Back',  custom_id: `pa_cbt_back:${activeCombatId}:${entityId}:${catSlot}` },
                    { type: 2, style: 4, label: 'Cancel',  custom_id: `pa_cbt_cancel:${activeCombatId}` },
                ],
            },
        ],
    }];
}
