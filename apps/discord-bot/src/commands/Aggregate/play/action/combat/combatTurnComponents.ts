import { colors } from '../../../../../core/colors';
import type { CombatParticipantOrder, XpGrant } from '../../../../../services/play/combatService';

export function buildCombatAnnouncementComponents(
    activeCombatId: number,
    type:           'spar' | 'fight',
    participants:   CombatParticipantOrder[],
    entityNameMap:  Map<number, string>,
    entityUserMap:  Map<number, string>,
    removedNames:   string[],
): object[] {
    const typeLabel = type === 'spar' ? 'Spar' : 'Fight';

    // Group by allyFactionId, preserving initiative order within each team
    const teamGroups = new Map<number, number[]>();
    for (const p of participants) {
        if (!teamGroups.has(p.allyFactionId)) teamGroups.set(p.allyFactionId, []);
        teamGroups.get(p.allyFactionId)!.push(p.entityId);
    }
    const sortedTeams = [...teamGroups.entries()].sort(([a], [b]) => a - b);

    const inner: object[] = [
        { type: 10, content: `## ⚔ ${typeLabel} has started!` },
        { type: 14, divider: true },
    ];

    sortedTeams.forEach(([, entityIds], i) => {
        if (i > 0) inner.push({ type: 14, divider: true });
        inner.push({ type: 10, content: `**TEAM ${i + 1}**` });
        for (const entityId of entityIds) {
            const userId = entityUserMap.get(entityId);
            const name   = entityNameMap.get(entityId) ?? 'Unknown';
            inner.push({ type: 10, content: `${userId ? `<@${userId}>` : name} — ${name}` });
        }
    });

    if (removedNames.length > 0) {
        inner.push({ type: 14, divider: false });
        inner.push({ type: 10, content: `-# ${removedNames.join(', ')} did not have enough energy and were removed.` });
    }

    return [{ type: 17, accent_color: colors.special, components: inner }];
}

export function buildCombatStateComponents(
    activeCombatId: number,
    type:           'spar' | 'fight',
    participants:   CombatParticipantOrder[],
    entityNameMap:  Map<number, string>,
): object[] {
    const typeLabel = type === 'spar' ? 'Spar' : 'Fight';

    // Group names by team (allyFactionId), preserving initiative order within each team
    const teamNames = new Map<number, string[]>();
    for (const p of participants) {
        if (!teamNames.has(p.allyFactionId)) teamNames.set(p.allyFactionId, []);
        teamNames.get(p.allyFactionId)!.push(entityNameMap.get(p.entityId) ?? 'Unknown');
    }
    const teamsText = [...teamNames.entries()]
        .sort(([a], [b]) => a - b)
        .map(([factionId, names]) => `**Team ${factionId}:** ${names.join(', ')}`)
        .join('\n');

    const orderText = participants
        .map((p, i) => `${i + 1}. ${entityNameMap.get(p.entityId) ?? 'Unknown'}`)
        .join('\n');

    return [{
        type:         17,
        accent_color: colors.special,
        components: [
            { type: 10, content: `## ⚔ ${typeLabel} — Combat #${activeCombatId}` },
            { type: 14 },
            { type: 10, content: teamsText },
            { type: 14 },
            { type: 10, content: `**Initiative order:**\n${orderText}` },
        ],
    }];
}

export function buildTurnPromptComponents(
    activeCombatId: number,
    entityId:       number,
    entityName:     string,
    userId:         string | undefined,
    round:          number,
    usedFlags:      number = 0,
): object[] {
    const ping = userId ? `<@${userId}>` : `**${entityName}**`;
    return [{
        type:         17,
        accent_color: colors.info,
        components: [
            { type: 10, content: `${ping} — it's **${entityName}**'s turn!` },
            { type: 14 },
            {
                type: 1,
                components: [
                    { type: 2, style: 1, label: 'Main Action',      custom_id: `pa_turn_main:${activeCombatId}:${entityId}`,  disabled: !!(usedFlags & 0b001) },
                    { type: 2, style: 2, label: 'Bonus Action',     custom_id: `pa_turn_bonus:${activeCombatId}:${entityId}`, disabled: !!(usedFlags & 0b010) },
                    { type: 2, style: 2, label: 'Item Interaction', custom_id: `pa_turn_item:${activeCombatId}:${entityId}`,  disabled: !!(usedFlags & 0b100) },
                    { type: 2, style: 4, label: 'End Turn',         custom_id: `pa_turn_end:${activeCombatId}:${entityId}` },
                ],
            },
            { type: 10, content: `-# Round ${round}` },
        ],
    }];
}

export function buildTurnEndedComponents(entityName: string): object[] {
    return [{
        type:         17,
        accent_color: colors.info,
        components:   [{ type: 10, content: `-# ${entityName}'s turn has ended.` }],
    }];
}

export function buildSecondWindComponents(
    activeCombatId: number,
    entityId:       number,
    entityName:     string,
    userId:         string | undefined,
    round:          number,
): object[] {
    const ping = userId ? `<@${userId}>` : `**${entityName}**`;
    return [{
        type:         17,
        accent_color: colors.warning,
        components: [
            { type: 10, content: `${ping} — **${entityName}** has been knocked down!\nAccept **Second Wind** to recover full HP and continue — but if you fall again, you will be eliminated.` },
            { type: 14 },
            {
                type: 1,
                components: [
                    { type: 2, style: 1, label: 'Accept Second Wind', custom_id: `pa_sw_accept:${activeCombatId}:${entityId}` },
                    { type: 2, style: 4, label: 'Decline',            custom_id: `pa_sw_decline:${activeCombatId}:${entityId}` },
                ],
            },
            { type: 10, content: `-# Round ${round}` },
        ],
    }];
}

export function buildCombatOutcomeComponents(
    winningAllyFactionId: number | null,
    xpGrants:             XpGrant[],
): object[] {
    const outcomeText = winningAllyFactionId !== null
        ? `Team ${winningAllyFactionId} wins!`
        : 'The combat has ended in a draw.';

    const inner: object[] = [
        { type: 10, content: `## ⚔ Combat Over` },
        { type: 14 },
        { type: 10, content: outcomeText },
    ];

    if (xpGrants.length > 0) {
        // Group grants by entityId so each entity gets one block
        const byEntity = new Map<number, XpGrant[]>();
        for (const g of xpGrants) {
            if (!byEntity.has(g.entityId)) byEntity.set(g.entityId, []);
            byEntity.get(g.entityId)!.push(g);
        }

        const lines: string[] = [];
        for (const [, grants] of byEntity) {
            const name       = grants[0].entityName;
            const grantLines = grants.map(g => {
                const levelUp = g.levelsGained > 0 ? ` ⬆ Lv ${g.newLevel}` : '';
                return `  ${g.disciplineName} +${g.xpGained} XP${levelUp}`;
            });
            lines.push(`**${name}**\n${grantLines.join('\n')}`);
        }

        inner.push({ type: 14 });
        inner.push({ type: 10, content: lines.join('\n\n') });
    }

    return [{ type: 17, accent_color: colors.special, components: inner }];
}
