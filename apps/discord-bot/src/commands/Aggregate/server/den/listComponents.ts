import { colors } from '../../../../core/colors';
import { Den } from '../../../../services/server/denService';

export const DEN_LIST_PAGE_SIZE = 10;

/**
 * Builds the raw Discord API JSON component payload for the den list panel.
 * Uses raw JSON so each row can have a Config button accessory to the right.
 *
 * Component budget per message: 40 total (recursive).
 * Overhead: 1 container + 1 header + 1 separator = 3.
 * Per den: 1 section + 1 text display + 1 accessory button = 3.
 * Pagination row: 1 action row + 2 buttons = 3.
 * Max safe dens per page: (40 - 3 - 3) / 3 = 11 → use 10 for a clean limit.
 */
export function buildDenListComponents(dens: Den[], page: number): object[] {
    const totalPages = Math.ceil(dens.length / DEN_LIST_PAGE_SIZE);
    const slice      = dens.slice(page * DEN_LIST_PAGE_SIZE, (page + 1) * DEN_LIST_PAGE_SIZE);

    const sections = slice.map(den => ({
        type:       9,  // Section
        components: [{ type: 10, content: `<#${den.channelId}>` }],
        accessory:  {
            type:      2,
            label:     'Config',
            style:     2,  // Secondary
            custom_id: `den_list_config:${den.channelId}`,
        },
    }));

    const components: object[] = [
        {
            type:         17,  // Container
            accent_color: colors.info,
            components:   [
                { type: 10, content: `## Echo Dens` },
                { type: 14, divider: true },
                ...sections,
            ],
        },
    ];

    if (totalPages > 1) {
        components.push({
            type:       1,  // ActionRow
            components: [
                {
                    type:      2,
                    label:     'Previous',
                    style:     2,
                    custom_id: `den_list_page:${page - 1}`,
                    disabled:  page === 0,
                },
                {
                    type:      2,
                    label:     `Page ${page + 1} of ${totalPages}`,
                    style:     2,
                    custom_id: 'den_list_page_label',
                    disabled:  true,
                },
                {
                    type:      2,
                    label:     'Next',
                    style:     2,
                    custom_id: `den_list_page:${page + 1}`,
                    disabled:  page === totalPages - 1,
                },
            ],
        });
    }

    components.push({
        type:       1,  // ActionRow
        components: [
            { type: 2, label: 'Done', style: 3, custom_id: 'den_list_done' },
        ],
    });

    return components;
}
