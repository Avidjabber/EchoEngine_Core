import type { EnvConditionModifiersData } from '../../../../services/model/envConditionPackService';
import { colors } from '../../../../core/colors';

export type ModifierFilter = 'all' | 'world' | 'stat' | 'proficiency';

// Component budget per page:
// Container(1) + header text(1) + subtitle text(1) + separator(1) = 4 inside
// 10 rows × (section(1) + text_display(1) + accessory button(1)) = 30
// Pagination action_row(1) + 3 buttons = 4   [omitted when single page]
// Filter action_row(1) + select_menu(1) = 2
// Total: 4 + 30 + 4 + 2 = 40 ✓
export const EC_LIST_PAGE_SIZE = 10;

type WorldItem  = { type: 'world';       condition: string; effectType: string; relation: string; value: number | null };
type StatItem   = { type: 'stat';        condition: string; stat: string; value: number };
type ProfItem   = { type: 'proficiency'; condition: string; proficiency: string; value: number; hasDisadvantage: boolean; hasAdvantage: boolean };
type ModifierItem = WorldItem | StatItem | ProfItem;

function toItems(data: EnvConditionModifiersData, filter: ModifierFilter): ModifierItem[] {
    const world: ModifierItem[] = filter === 'stat' || filter === 'proficiency' ? [] :
        data.worldModifiers.map(m => ({ type: 'world' as const, ...m }));
    const stat: ModifierItem[] = filter === 'world' || filter === 'proficiency' ? [] :
        data.statModifiers.map(m => ({ type: 'stat' as const, ...m }));
    const prof: ModifierItem[] = filter === 'world' || filter === 'stat' ? [] :
        data.proficiencyModifiers.map(m => ({ type: 'proficiency' as const, ...m }));
    return [...world, ...stat, ...prof];
}

function signedValue(v: number): string {
    return v > 0 ? `+${v}` : `${v}`;
}

function rowText(item: ModifierItem): string {
    if (item.type === 'world') {
        const val = item.value !== null ? signedValue(item.value) : 'block';
        return `**${item.condition}** — ${item.effectType}\n-# ${item.relation} · ${val}`;
    }
    if (item.type === 'stat') {
        return `**${item.condition}** — ${item.stat}\n-# ${signedValue(item.value)}`;
    }
    const flag = item.hasDisadvantage ? ' · disadvantage' : item.hasAdvantage ? ' · advantage' : '';
    return `**${item.condition}** — ${item.proficiency}\n-# ${signedValue(item.value)}${flag}`;
}

function editId(item: ModifierItem): string {
    if (item.type === 'world')       return `ec_edit:world:${item.condition}:${item.effectType}`;
    if (item.type === 'stat')        return `ec_edit:stat:${item.condition}:${item.stat}`;
    return `ec_edit:proficiency:${item.condition}:${item.proficiency}`;
}

function filterOptions(current: ModifierFilter) {
    return [
        { label: 'All modifiers',         value: 'all',         default: current === 'all'         },
        { label: 'World modifiers',       value: 'world',       default: current === 'world'       },
        { label: 'Stat modifiers',        value: 'stat',        default: current === 'stat'        },
        { label: 'Proficiency modifiers', value: 'proficiency', default: current === 'proficiency' },
    ];
}

const filterRow = (current: ModifierFilter): object => ({
    type:       1,
    components: [{
        type:        3,
        custom_id:   'ec_list_filter',
        placeholder: 'Filter by type',
        options:     filterOptions(current),
    }],
});

export function buildEnvConditionListComponents(
    data:    EnvConditionModifiersData,
    page:    number,
    filter:  ModifierFilter,
    isAdmin: boolean,
): object[] {
    const items      = toItems(data, filter);
    const totalPages = Math.ceil(items.length / EC_LIST_PAGE_SIZE) || 1;
    const slice      = items.slice(page * EC_LIST_PAGE_SIZE, (page + 1) * EC_LIST_PAGE_SIZE);

    const worldCount = data.worldModifiers.length;
    const statCount  = data.statModifiers.length;
    const profCount  = data.proficiencyModifiers.length;
    const total      = worldCount + statCount + profCount;

    const typeLabel = filter === 'world' ? 'World' : filter === 'stat' ? 'Stat' : filter === 'proficiency' ? 'Proficiency' : 'All';

    const subtitleCounts = filter === 'all'
        ? `${worldCount} world · ${statCount} stat · ${profCount} proficiency`
        : `${items.length} modifier${items.length !== 1 ? 's' : ''}`;

    const pageInfo = totalPages > 1 ? ` · Page ${page + 1} of ${totalPages}` : '';
    const subtitle = `-# ${typeLabel} modifiers · ${subtitleCounts}${pageInfo}`;

    if (items.length === 0) {
        return [
            {
                type:         17,
                accent_color: colors.info,
                components:   [
                    { type: 10, content: '## Env Condition Modifiers' },
                    {
                        type:    10,
                        content: total === 0
                            ? '-# No modifiers configured for this guild yet.'
                            : `-# No ${typeLabel.toLowerCase()} modifiers configured.`,
                    },
                ],
            },
            filterRow(filter),
            { type: 1, components: [{ type: 2, label: 'Done', style: 2, custom_id: 'ec_list_done' }] },
        ];
    }

    const sections = slice.map(item => isAdmin
        ? {
            type:       9,
            components: [{ type: 10, content: rowText(item) }],
            accessory:  { type: 2, label: 'Edit', style: 2, custom_id: editId(item) },
        }
        : { type: 10, content: rowText(item) },
    );

    const components: object[] = [
        {
            type:         17,
            accent_color: colors.info,
            components:   [
                { type: 10, content: '## Env Condition Modifiers' },
                { type: 10, content: subtitle },
                { type: 14, divider: true },
                ...sections,
            ],
        },
    ];

    if (totalPages > 1) {
        components.push({
            type:       1,
            components: [
                {
                    type:      2,
                    label:     '← Previous',
                    style:     2,
                    custom_id: `ec_list_page:${page - 1}:${filter}`,
                    disabled:  page === 0,
                },
                {
                    type:      2,
                    label:     `${page + 1} / ${totalPages}`,
                    style:     2,
                    custom_id: 'ec_list_page_label',
                    disabled:  true,
                },
                {
                    type:      2,
                    label:     'Next →',
                    style:     2,
                    custom_id: `ec_list_page:${page + 1}:${filter}`,
                    disabled:  page >= totalPages - 1,
                },
            ],
        });
    }

    components.push(filterRow(filter));
    components.push({ type: 1, components: [{ type: 2, label: 'Done', style: 2, custom_id: 'ec_list_done' }] });

    return components;
}
