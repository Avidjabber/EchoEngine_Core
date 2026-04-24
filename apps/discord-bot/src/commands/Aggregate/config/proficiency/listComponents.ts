import { colors } from '../../../../core/colors';
import type { ProficiencyListItem } from '../../../../services/model/proficiencyPackService';

const PAGE_SIZE = 10;

export function buildProficiencyListComponents(items: ProficiencyListItem[], page: number): object[] {
    const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
    const slice      = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const pageInfo   = totalPages > 1 ? ` · Page ${page + 1} of ${totalPages}` : '';
    const subtitle   = `-# ${items.length} proficiencie${items.length !== 1 ? 's' : ''}${pageInfo}`;

    if (items.length === 0) {
        return [
            {
                type:         17,
                accent_color: colors.info,
                components:   [
                    { type: 10, content: '## Proficiencies' },
                    { type: 10, content: '-# No proficiencies configured for this guild yet.' },
                ],
            },
            { type: 1, components: [{ type: 2, style: 2, custom_id: 'prof_list_done', label: 'Done' }] },
        ];
    }

    const sections = slice.map(p => ({
        type:       9,
        components: [{ type: 10, content: `**${p.name}**\n-# ${p.codeName} · ${p.stat}` }],
        accessory:  { type: 2, style: 2, custom_id: `prof_list_info:${page}:${p.codeName}`, label: 'Info' },
    }));

    const navButtons: object[] = [];

    if (totalPages > 1) {
        navButtons.push(
            { type: 2, style: 2, custom_id: `prof_list_page:${page - 1}`, label: '← Prev', disabled: page === 0 },
            { type: 2, style: 2, custom_id: 'prof_list_noop', label: `${page + 1} / ${totalPages}`, disabled: true },
            { type: 2, style: 2, custom_id: `prof_list_page:${page + 1}`, label: 'Next →', disabled: page >= totalPages - 1 },
        );
    }

    navButtons.push({ type: 2, style: 2, custom_id: 'prof_list_done', label: 'Done' });

    return [
        {
            type:         17,
            accent_color: colors.info,
            components:   [
                { type: 10, content: '## Proficiencies' },
                { type: 10, content: subtitle },
                { type: 14, divider: true },
                ...sections,
            ],
        },
        { type: 1, components: navButtons },
    ];
}

export function buildProficiencyListInfoComponents(prof: ProficiencyListItem, fromPage: number): object[] {
    const desc = prof.description || '*(none)*';
    const content = [
        '## Proficiency Info',
        '',
        `**Name:** ${prof.name}`,
        `**Code Name:** \`${prof.codeName}\``,
        `**Stat:** ${prof.stat}`,
        `**Description:** ${desc}`,
    ].join('\n');

    return [{
        type:         17,
        accent_color: colors.info,
        components: [
            { type: 10, content },
            { type: 14, divider: true },
            {
                type:       1,
                components: [
                    { type: 2, style: 2, custom_id: `prof_list_back:${fromPage}`, label: '← Back' },
                    { type: 2, style: 2, custom_id: 'prof_list_done',             label: 'Done'   },
                ],
            },
        ],
    }];
}
