import type { EnvConditionInfoData } from '../../../../services/model/envConditionPackService';
import { colors } from '../../../../core/colors';

export const EC_DELETE_PAGE_SIZE = 10;

function conditionsWithModifiers(data: EnvConditionInfoData) {
    const configured = new Set([
        ...data.worldModifiers.map(m       => m.condition),
        ...data.statModifiers.map(m        => m.condition),
        ...data.proficiencyModifiers.map(m => m.condition),
    ]);
    return data.conditions.filter(c => configured.has(c.codeName));
}

function modifierCounts(data: EnvConditionInfoData, codeName: string) {
    return {
        world: data.worldModifiers.filter(m       => m.condition === codeName).length,
        stat:  data.statModifiers.filter(m        => m.condition === codeName).length,
        prof:  data.proficiencyModifiers.filter(m => m.condition === codeName).length,
    };
}

export function buildEnvConditionDeletePickerComponents(
    data: EnvConditionInfoData,
    page: number,
): object[] {
    const configured = conditionsWithModifiers(data);

    if (configured.length === 0) {
        return [{
            type:         17,
            accent_color: colors.info,
            components:   [
                { type: 10, content: '## Delete Env Condition Modifiers' },
                { type: 10, content: '-# No modifiers configured for this guild.' },
            ],
        }];
    }

    const totalPages = Math.ceil(configured.length / EC_DELETE_PAGE_SIZE) || 1;
    const slice      = configured.slice(page * EC_DELETE_PAGE_SIZE, (page + 1) * EC_DELETE_PAGE_SIZE);

    const pageInfo = totalPages > 1 ? ` · Page ${page + 1} of ${totalPages}` : '';
    const subtitle = `-# ${configured.length} condition${configured.length !== 1 ? 's' : ''} with modifiers${pageInfo}`;

    const sections = slice.map(cond => {
        const counts = modifierCounts(data, cond.codeName);
        const parts: string[] = [];
        if (counts.world > 0) parts.push(`${counts.world} world`);
        if (counts.stat  > 0) parts.push(`${counts.stat} stat`);
        if (counts.prof  > 0) parts.push(`${counts.prof} proficiency`);

        return {
            type:       9,
            components: [{ type: 10, content: `**${cond.name}**\n-# ${parts.join(' · ')}` }],
            accessory:  {
                type:      2,
                label:     'Select',
                style:     2,
                custom_id: `ec_del_pick:${page}:${cond.codeName}`,
            },
        };
    });

    const components: object[] = [{
        type:         17,
        accent_color: colors.error,
        components:   [
            { type: 10, content: '## Delete Env Condition Modifiers' },
            { type: 10, content: subtitle },
            { type: 14, divider: true },
            ...sections,
        ],
    }];

    if (totalPages > 1) {
        components.push({
            type:       1,
            components: [
                {
                    type:      2,
                    label:     '← Previous',
                    style:     2,
                    custom_id: `ec_del_page:${page - 1}`,
                    disabled:  page === 0,
                },
                {
                    type:      2,
                    label:     `${page + 1} / ${totalPages}`,
                    style:     2,
                    custom_id: 'ec_del_page_label',
                    disabled:  true,
                },
                {
                    type:      2,
                    label:     'Next →',
                    style:     2,
                    custom_id: `ec_del_page:${page + 1}`,
                    disabled:  page >= totalPages - 1,
                },
            ],
        });
    }

    return components;
}

// listPage = -1 means the command was invoked directly (no picker to return to); show "Cancel" instead of "Back"
export function buildEnvConditionDeleteConfirmComponents(
    data:     EnvConditionInfoData,
    codeName: string,
    listPage: number,
): object[] {
    const condition = data.conditions.find(c => c.codeName === codeName);
    const name      = condition?.name ?? codeName;
    const counts    = modifierCounts(data, codeName);
    const total     = counts.world + counts.stat + counts.prof;

    const countLine = total === 0
        ? '-# No modifiers currently configured — nothing will be deleted.'
        : `-# ${counts.world} world · ${counts.stat} stat · ${counts.prof} proficiency`;

    const backButton = listPage >= 0
        ? { type: 2, label: '← Back', style: 2, custom_id: `ec_del_back:${listPage}` }
        : { type: 2, label: 'Cancel', style: 2, custom_id: `ec_del_back:-1`           };

    return [
        {
            type:         17,
            accent_color: colors.error,
            components:   [
                {
                    type:    10,
                    content: [
                        `## Delete ${name} Modifiers`,
                        'This will permanently delete all configured modifiers for this condition.',
                        '-# This action cannot be undone.',
                    ].join('\n'),
                },
                { type: 10, content: countLine },
            ],
        },
        {
            type:       1,
            components: [
                { type: 2, label: 'Confirm Delete', style: 4, custom_id: `ec_del_confirm:${listPage}:${codeName}` },
                backButton,
            ],
        },
    ];
}
