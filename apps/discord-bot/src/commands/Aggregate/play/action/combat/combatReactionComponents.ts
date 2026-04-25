import { colors } from '../../../../../core/colors';

export function buildReactionPromptComponents(
    activeCombatId:     number,
    defenderEntityId:   number,
    defenderEntityName: string,
    defenderUserId:     string | undefined,
    reactionProfiles:   Array<{ profileId: number; storedItemId: number; label: string }>,
): object[] {
    const ping = defenderUserId ? `<@${defenderUserId}>` : `**${defenderEntityName}**`;

    const buttons: object[] = reactionProfiles.map(p => ({
        type:      2,
        style:     1,
        label:     p.label.slice(0, 80),
        custom_id: `pa_react_use:${activeCombatId}:${defenderEntityId}:${p.profileId}:${p.storedItemId}`,
    }));
    buttons.push({
        type:      2,
        style:     2,
        label:     'Skip',
        custom_id: `pa_react_skip:${activeCombatId}:${defenderEntityId}`,
    });

    return [{
        type:         17,
        accent_color: colors.warning,
        components: [
            { type: 10, content: `${ping} — **${defenderEntityName}** can react!` },
            { type: 14 },
            { type: 1, components: buttons },
        ],
    }];
}
