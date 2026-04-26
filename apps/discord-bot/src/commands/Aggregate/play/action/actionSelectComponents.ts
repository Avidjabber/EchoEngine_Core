import { colors } from '../../../../core/colors';
import { ACTION_DEFS } from './defs';
import type { ActionCategory } from './defs';
import type { PlayCharacter } from '../../../../services/play/entityService';

export function buildActionSelectComponents(
    category: ActionCategory,
    char:     PlayCharacter,
    fromPage: number,
): object[] {
    const actions = ACTION_DEFS[category];

    const sections = actions.map(a => ({
        type:       9,
        components: [{ type: 10, content: `**${a.name}**\n-# ${a.description}` }],
        accessory:  { type: 2, style: 1, custom_id: `pa_action_pick:${category}:${char.id}:${a.code}`, label: 'Select' },
    }));

    return [
        {
            type:         17,
            accent_color: colors.info,
            components: [
                { type: 10, content: '## Choose an action' },
                { type: 10, content: `-# Playing as **${char.name}**` },
                { type: 14, divider: true },
                ...sections,
            ],
        },
        {
            type:       1,
            components: [
                { type: 2, style: 2, custom_id: `pa_action_back:${category}:${fromPage}`, label: '← Back' },
            ],
        },
    ];
}
