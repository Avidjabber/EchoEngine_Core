import { colors } from '../../../../../core/colors';

export function buildReactionPromptComponents(
    activeCombatId:     number,
    defenderEntityId:   number,
    defenderEntityName: string,
    defenderUserId:     string | undefined,
    reactionProfiles:   Array<{ profileId: number; storedItemId: number; label: string }>,
): object[] {
    const ping = defenderUserId ? `<@${defenderUserId}>` : `**${defenderEntityName}**`;

    // Split reaction buttons into rows of 4 to stay within Discord's 5-button-per-row limit.
    // Skip is always placed on its own final row.
    const rows: object[] = [];
    for (let i = 0; i < reactionProfiles.length; i += 4) {
        rows.push({
            type: 1,
            components: reactionProfiles.slice(i, i + 4).map(p => ({
                type:      2,
                style:     1,
                label:     p.label.slice(0, 80),
                custom_id: `pa_react_use:${activeCombatId}:${defenderEntityId}:${p.profileId}:${p.storedItemId}`,
            })),
        });
    }
    rows.push({
        type:       1,
        components: [{ type: 2, style: 2, label: 'Skip', custom_id: `pa_react_skip:${activeCombatId}:${defenderEntityId}` }],
    });

    return [{
        type:         17,
        accent_color: colors.warning,
        components: [
            { type: 10, content: `${ping} — **${defenderEntityName}** can react!` },
            { type: 14 },
            ...rows,
        ],
    }];
}
