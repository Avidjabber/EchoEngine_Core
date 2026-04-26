import { colors } from '../../../../core/colors';
import type { PlayCharacter } from '../../../../services/play/entityService';
import type { ActionCategory } from './defs';

const PAGE_SIZE = 10;

export function buildCharacterSelectComponents(
    chars:    PlayCharacter[],
    category: ActionCategory,
    page:     number,
): object[] {
    if (chars.length === 0) {
        return [{
            type:         17,
            accent_color: colors.info,
            components: [
                { type: 10, content: '## Choose your character' },
                { type: 10, content: '-# You have no active characters.' },
            ],
        }];
    }

    const totalPages = Math.ceil(chars.length / PAGE_SIZE);
    const slice      = chars.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const pageInfo   = totalPages > 1 ? ` · Page ${page + 1} of ${totalPages}` : '';

    const sections = slice.map(c => ({
        type:       9,
        components: [{ type: 10, content: `**${c.name}**  ·  Age: ${c.age}  ·  ${c.factionName}` }],
        accessory:  { type: 2, style: 1, custom_id: `pa_char_pick:${category}:${page}:${c.id}`, label: 'Select' },
    }));

    const navButtons: object[] = [];
    if (totalPages > 1) {
        navButtons.push(
            { type: 2, style: 2, custom_id: `pa_char_page:${category}:${page - 1}`, label: '← Prev', disabled: page === 0 },
            { type: 2, style: 2, custom_id: 'pa_char_noop', label: `${page + 1} / ${totalPages}`, disabled: true },
            { type: 2, style: 2, custom_id: `pa_char_page:${category}:${page + 1}`, label: 'Next →', disabled: page >= totalPages - 1 },
        );
    }
    navButtons.push({ type: 2, style: 2, custom_id: 'pa_char_cancel', label: 'Cancel' });

    return [
        {
            type:         17,
            accent_color: colors.info,
            components: [
                { type: 10, content: '## Choose your character' },
                { type: 10, content: `-# ${chars.length} character${chars.length !== 1 ? 's' : ''}${pageInfo}` },
                { type: 14, divider: true },
                ...sections,
            ],
        },
        { type: 1, components: navButtons },
    ];
}
