import { colors } from '../../../../../core/colors';
import type { AvailableAction, CombatParticipantInfo } from '../../../../../services/play/combatService';

const CATEGORY_LABEL: Record<'main' | 'bonus' | 'item', string> = {
    main:  'Main Action',
    bonus: 'Bonus Action',
    item:  'Item Interaction',
};

function actionSummary(action: AvailableAction): string {
    const parts: string[] = [];
    if (action.damageDice) parts.push(`⚔ ${action.damageDice}`);
    if (action.healDice)   parts.push(`💚 ${action.healDice}`);
    return parts.length ? ` — ${parts.join(', ')}` : '';
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
