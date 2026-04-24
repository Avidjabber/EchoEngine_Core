import type { EnvConditionInfoData } from '../../../../services/model/envConditionPackService';
import { colors } from '../../../../core/colors';

export const EC_INFO_PAGE_SIZE = 10;

function signedValue(v: number): string {
    return v > 0 ? `+${v}` : `${v}`;
}

export function buildEnvConditionInfoListComponents(
    data: EnvConditionInfoData,
    page: number,
): object[] {
    const { conditions } = data;
    const totalPages = Math.ceil(conditions.length / EC_INFO_PAGE_SIZE) || 1;
    const slice      = conditions.slice(page * EC_INFO_PAGE_SIZE, (page + 1) * EC_INFO_PAGE_SIZE);

    const pageInfo = totalPages > 1 ? ` · Page ${page + 1} of ${totalPages}` : '';
    const subtitle = `-# ${conditions.length} condition${conditions.length !== 1 ? 's' : ''}${pageInfo}`;

    const sections = slice.map(cond => ({
        type:       9,
        components: [{ type: 10, content: `**${cond.name}**\n-# ${cond.codeName}` }],
        accessory:  {
            type:      2,
            label:     'Info',
            style:     2,
            custom_id: `ec_info_d:${page}:${cond.codeName}`,
        },
    }));

    const components: object[] = [
        {
            type:         17,
            accent_color: colors.info,
            components:   [
                { type: 10, content: '## Env Conditions' },
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
                    custom_id: `ec_info_page:${page - 1}`,
                    disabled:  page === 0,
                },
                {
                    type:      2,
                    label:     `${page + 1} / ${totalPages}`,
                    style:     2,
                    custom_id: 'ec_info_page_label',
                    disabled:  true,
                },
                {
                    type:      2,
                    label:     'Next →',
                    style:     2,
                    custom_id: `ec_info_page:${page + 1}`,
                    disabled:  page >= totalPages - 1,
                },
            ],
        });
    }

    return components;
}

export function buildEnvConditionInfoDetailComponents(
    data:     EnvConditionInfoData,
    codeName: string,
    listPage: number,
): object[] {
    const condition  = data.conditions.find(c => c.codeName === codeName);
    const worldMods  = data.worldModifiers.filter(m => m.condition === codeName);
    const statMods   = data.statModifiers.filter(m => m.condition === codeName);
    const profMods   = data.proficiencyModifiers.filter(m => m.condition === codeName);

    if (!condition) {
        return buildEnvConditionInfoListComponents(data, listPage);
    }

    const inner: object[] = [
        { type: 10, content: `## ${condition.name}` },
        { type: 10, content: `-# ${codeName}` },
    ];

    const hasAny = worldMods.length > 0 || statMods.length > 0 || profMods.length > 0;

    if (!hasAny) {
        inner.push({ type: 10, content: '-# No modifiers configured for this guild.' });
    } else {
        if (worldMods.length > 0) {
            inner.push({ type: 14, divider: true });
            inner.push({ type: 10, content: '**World modifiers**' });
            for (const m of worldMods) {
                const val = m.value !== null ? signedValue(m.value) : 'block';
                inner.push({ type: 10, content: `-# ${m.effectType} · ${m.relation} · ${val}` });
            }
        }
        if (statMods.length > 0) {
            inner.push({ type: 14, divider: true });
            inner.push({ type: 10, content: '**Stat modifiers**' });
            for (const m of statMods) {
                inner.push({ type: 10, content: `-# ${m.stat} · ${signedValue(m.value)}` });
            }
        }
        if (profMods.length > 0) {
            inner.push({ type: 14, divider: true });
            inner.push({ type: 10, content: '**Proficiency modifiers**' });
            for (const m of profMods) {
                const flag = m.hasDisadvantage ? ' · disadvantage' : m.hasAdvantage ? ' · advantage' : '';
                inner.push({ type: 10, content: `-# ${m.proficiency} · ${signedValue(m.value)}${flag}` });
            }
        }
    }

    return [
        {
            type:         17,
            accent_color: colors.info,
            components:   inner,
        },
        {
            type:       1,
            components: [{
                type:      2,
                label:     '← Back',
                style:     2,
                custom_id: `ec_info_back:${listPage}`,
            }],
        },
    ];
}
