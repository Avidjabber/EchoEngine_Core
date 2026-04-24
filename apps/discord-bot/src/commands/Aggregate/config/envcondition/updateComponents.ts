import type { EnvConditionInfoData } from '../../../../services/model/envConditionPackService';
import type { EnvConditionUpdateState, UpdateActiveField } from './updateState';
import { colors } from '../../../../core/colors';

// ── Condition picker ──────────────────────────────────────────────────────────

const UPDATE_PICKER_PAGE_SIZE = 10;

export function buildUpdatePickerComponents(data: EnvConditionInfoData, page: number): object[] {
    const { conditions } = data;
    const totalPages = Math.ceil(conditions.length / UPDATE_PICKER_PAGE_SIZE) || 1;
    const slice      = conditions.slice(page * UPDATE_PICKER_PAGE_SIZE, (page + 1) * UPDATE_PICKER_PAGE_SIZE);

    const pageInfo = totalPages > 1 ? ` · Page ${page + 1} of ${totalPages}` : '';
    const subtitle = `-# ${conditions.length} condition${conditions.length !== 1 ? 's' : ''}${pageInfo}`;

    const sections = slice.map(cond => ({
        type:       9,
        components: [{ type: 10, content: `**${cond.name}**\n-# ${cond.codeName}` }],
        accessory:  {
            type:      2,
            label:     'Select',
            style:     2,
            custom_id: `ec_upd_cpick:${page}:${cond.codeName}`,
        },
    }));

    const components: object[] = [
        {
            type:         17,
            accent_color: colors.info,
            components:   [
                { type: 10, content: '## Update Env Condition Modifier' },
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
                { type: 2, label: '← Previous', style: 2, custom_id: `ec_upd_cpage:${page - 1}`, disabled: page === 0 },
                { type: 2, label: `${page + 1} / ${totalPages}`, style: 2, custom_id: 'ec_upd_cpage_label', disabled: true },
                { type: 2, label: 'Next →',     style: 2, custom_id: `ec_upd_cpage:${page + 1}`, disabled: page >= totalPages - 1 },
            ],
        });
    }

    return components;
}

// ── Type selector ─────────────────────────────────────────────────────────────

export function buildUpdateTypeSelector(state: EnvConditionUpdateState): object[] {
    const navRow: object[] = [
        ...(state.pickerPage >= 0 ? [{ type: 2, label: '← Back', style: 2, custom_id: 'ec_upd_cback' }] : []),
        { type: 2, label: 'Cancel', style: 4, custom_id: 'ec_upd_cancel' },
    ];

    return [
        {
            type:         17,
            accent_color: colors.info,
            components:   [
                { type: 10, content: '## Update Env Condition Modifier' },
                { type: 10, content: `-# **${state.conditionName}** · ${state.codeName}` },
            ],
        },
        {
            type:       1,
            components: [{
                type:        3,
                custom_id:   'ec_upd_type',
                placeholder: 'Select modifier type',
                options:     [
                    { label: 'World modifier',       value: 'world',       description: 'Affects world effects like filth and spoilage' },
                    { label: 'Stat modifier',        value: 'stat',        description: 'Applies a flat bonus or penalty to a character stat' },
                    { label: 'Proficiency modifier', value: 'proficiency', description: 'Adjusts skill check rolls; can apply advantage or disadvantage' },
                ],
            }],
        },
        { type: 1, components: navRow },
    ];
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function signedValue(v: number): string {
    const display = Number.isInteger(v) ? String(v) : v.toFixed(2);
    return v > 0 ? `+${display}` : display;
}

export function describeWorldModifier(effectType: string, relation: string, value: number | null): string {
    const val = relation === 'block' ? 'N/A (block)' : value !== null ? signedValue(value) : '*Not set*';
    return `${effectType} · ${relation} · ${val}`;
}

export function describeStatModifier(stat: string, value: number): string {
    return `${stat} · ${signedValue(value)}`;
}

export function describeProfModifier(proficiency: string, value: number, hasDisadvantage: boolean, hasAdvantage: boolean): string {
    const flag = hasDisadvantage ? ' · disadvantage' : hasAdvantage ? ' · advantage' : '';
    return `${proficiency} · ${signedValue(value)}${flag}`;
}

function selectOptions(values: string[], current: string | null): object[] {
    return values.map(v => ({ label: v, value: v, default: v === current }));
}

function makeFieldSection(
    label:       string,
    value:       string,
    description: string,
    fieldKey:    UpdateActiveField,
    activeField: UpdateActiveField | null,
): object {
    const isActive      = activeField === fieldKey;
    const otherIsActive = activeField !== null && !isActive;
    return {
        type:       9,
        components: [{ type: 10, content: `**${label}** — ${value}\n-# ${description}` }],
        accessory:  {
            type:      2,
            label:     isActive ? '↩' : 'Set',
            style:     2,
            custom_id: isActive ? 'ec_upd_unset' : `ec_upd_set:${fieldKey}`,
            disabled:  otherIsActive,
        },
    };
}

function makeValueSection(valueDisplay: string, description: string, disabled: boolean): object {
    return {
        type:       9,
        components: [{ type: 10, content: `**Value** — ${valueDisplay}\n-# ${description}` }],
        accessory:  {
            type:      2,
            label:     'Set',
            style:     2,
            custom_id: 'ec_upd_val',
            disabled,
        },
    };
}

// ── World modifier form ───────────────────────────────────────────────────────

export function buildWorldForm(state: EnvConditionUpdateState): object[] {
    const { activeField } = state;
    const isBlock = state.relation === 'block';

    const valueDisplay = isBlock
        ? 'N/A (block)'
        : state.value !== null
            ? signedValue(state.value)
            : '*Not set*';

    const canSave = state.effectType !== null
        && state.relation !== null
        && (isBlock || state.value !== null);

    const inner: object[] = [
        { type: 10, content: '## Update World Modifier' },
        { type: 10, content: `-# **${state.conditionName}** · ${state.codeName}` },
        { type: 14, divider: true },
        makeFieldSection('Effect type', state.effectType ?? '*Not set*', 'The world effect this condition modifies',       'effectType', activeField),
        makeFieldSection('Relation',    state.relation   ?? '*Not set*', 'increase · decrease · block',                   'relation',   activeField),
        makeValueSection(valueDisplay,                                    'Magnitude — leave blank when relation is block', isBlock || activeField !== null),
    ];

    const components: object[] = [{ type: 17, accent_color: colors.info, components: inner }];

    if (activeField === 'effectType') {
        components.push({ type: 1, components: [{ type: 3, custom_id: 'ec_upd_et',  placeholder: 'Effect type', options: selectOptions(state.effectTypes, state.effectType) }] });
    }
    if (activeField === 'relation') {
        components.push({ type: 1, components: [{ type: 3, custom_id: 'ec_upd_rel', placeholder: 'Relation',    options: selectOptions(state.relations,   state.relation)   }] });
    }

    components.push({
        type:       1,
        components: [
            { type: 2, label: 'Save',        style: 3, custom_id: 'ec_upd_save',   disabled: !canSave || activeField !== null },
            ...(state.hasExisting ? [{ type: 2, label: 'Remove', style: 4, custom_id: 'ec_upd_remove', disabled: activeField !== null }] : []),
            { type: 2, label: 'Change type', style: 2, custom_id: 'ec_upd_retype', disabled: activeField !== null },
            { type: 2, label: 'Cancel',      style: 4, custom_id: 'ec_upd_cancel', disabled: activeField !== null },
        ],
    });

    return components;
}

// ── Stat modifier form ────────────────────────────────────────────────────────

export function buildStatForm(state: EnvConditionUpdateState): object[] {
    const { activeField } = state;
    const valueDisplay    = state.value !== null ? signedValue(state.value) : '*Not set*';
    const canSave         = state.stat !== null && state.value !== null;

    const inner: object[] = [
        { type: 10, content: '## Update Stat Modifier' },
        { type: 10, content: `-# **${state.conditionName}** · ${state.codeName}` },
        { type: 14, divider: true },
        makeFieldSection('Stat',  state.stat ?? '*Not set*', 'The character attribute to modify', 'stat', activeField),
        makeValueSection(valueDisplay, 'Flat bonus or penalty applied while this condition is active', activeField !== null),
    ];

    const components: object[] = [{ type: 17, accent_color: colors.info, components: inner }];

    if (activeField === 'stat') {
        components.push({ type: 1, components: [{ type: 3, custom_id: 'ec_upd_stat', placeholder: 'Stat', options: selectOptions(state.stats, state.stat) }] });
    }

    components.push({
        type:       1,
        components: [
            { type: 2, label: 'Save',        style: 3, custom_id: 'ec_upd_save',   disabled: !canSave || activeField !== null },
            ...(state.hasExisting ? [{ type: 2, label: 'Remove', style: 4, custom_id: 'ec_upd_remove', disabled: activeField !== null }] : []),
            { type: 2, label: 'Change type', style: 2, custom_id: 'ec_upd_retype', disabled: activeField !== null },
            { type: 2, label: 'Cancel',      style: 4, custom_id: 'ec_upd_cancel', disabled: activeField !== null },
        ],
    });

    return components;
}

// ── Proficiency modifier form ─────────────────────────────────────────────────

export function buildProfForm(state: EnvConditionUpdateState): object[] {
    const { activeField } = state;
    const valueDisplay    = state.value !== null ? signedValue(state.value) : signedValue(0);
    const canSave         = state.proficiency !== null;

    const inner: object[] = [
        { type: 10, content: '## Update Proficiency Modifier' },
        { type: 10, content: `-# **${state.conditionName}** · ${state.codeName}` },
        { type: 14, divider: true },
        makeFieldSection('Proficiency', state.proficiency ?? '*Not set*', 'The skill check roll to modify',           'proficiency', activeField),
        makeValueSection(valueDisplay,                                     'Flat bonus or penalty to the roll',        activeField !== null),
        {
            type:       9,
            components: [{ type: 10, content: `**Disadvantage** — ${state.hasDisadvantage ? 'Yes' : 'No'}\n-# Roll twice and take the lower result` }],
            accessory:  {
                type:      2,
                label:     state.hasDisadvantage ? 'On' : 'Off',
                style:     state.hasDisadvantage ? 3 : 2,
                custom_id: 'ec_upd_disadv',
                disabled:  activeField !== null,
            },
        },
        {
            type:       9,
            components: [{ type: 10, content: `**Advantage** — ${state.hasAdvantage ? 'Yes' : 'No'}\n-# Roll twice and take the higher result` }],
            accessory:  {
                type:      2,
                label:     state.hasAdvantage ? 'On' : 'Off',
                style:     state.hasAdvantage ? 3 : 2,
                custom_id: 'ec_upd_adv',
                disabled:  activeField !== null,
            },
        },
    ];

    const components: object[] = [{ type: 17, accent_color: colors.info, components: inner }];

    if (activeField === 'proficiency') {
        components.push({ type: 1, components: [{ type: 3, custom_id: 'ec_upd_prof', placeholder: 'Proficiency', options: selectOptions(state.proficiencyDefs, state.proficiency) }] });
    }

    components.push({
        type:       1,
        components: [
            { type: 2, label: 'Save',        style: 3, custom_id: 'ec_upd_save',   disabled: !canSave || activeField !== null },
            ...(state.hasExisting ? [{ type: 2, label: 'Remove', style: 4, custom_id: 'ec_upd_remove', disabled: activeField !== null }] : []),
            { type: 2, label: 'Change type', style: 2, custom_id: 'ec_upd_retype', disabled: activeField !== null },
            { type: 2, label: 'Cancel',      style: 4, custom_id: 'ec_upd_cancel', disabled: activeField !== null },
        ],
    });

    return components;
}

// ── Remove confirmation ───────────────────────────────────────────────────────

export function buildRemoveConfirmation(state: EnvConditionUpdateState): object[] {
    let description = '';
    if (state.modifierType === 'world' && state.effectType)
        description = describeWorldModifier(state.effectType, state.relation!, state.value);
    if (state.modifierType === 'stat' && state.stat)
        description = describeStatModifier(state.stat, state.value!);
    if (state.modifierType === 'proficiency' && state.proficiency)
        description = describeProfModifier(state.proficiency, state.value ?? 0, state.hasDisadvantage, state.hasAdvantage);

    return [
        {
            type:         17,
            accent_color: colors.error,
            components:   [
                { type: 10, content: '## Remove Modifier?' },
                { type: 10, content: `-# **${state.conditionName}** · ${state.codeName}` },
                { type: 14, divider: true },
                { type: 10, content: `**Current value**\n-# ${description}` },
                { type: 10, content: `-# This cannot be undone.` },
            ],
        },
        {
            type:       1,
            components: [
                { type: 2, label: 'Confirm remove', style: 4, custom_id: 'ec_upd_rm_confirm' },
                { type: 2, label: '← Back',         style: 2, custom_id: 'ec_upd_rm_back' },
            ],
        },
    ];
}

// ── Overwrite confirmation ────────────────────────────────────────────────────

export function buildOverwriteConfirmation(
    state:              EnvConditionUpdateState,
    oldDescription:     string,
    newDescription:     string,
): object[] {
    return [
        {
            type:         17,
            accent_color: colors.special,
            components:   [
                { type: 10, content: '## Overwrite Existing Modifier?' },
                { type: 10, content: `-# **${state.conditionName}** · ${state.codeName}` },
                { type: 14, divider: true },
                { type: 10, content: `**Current value**\n-# ${oldDescription}` },
                { type: 10, content: `**New value**\n-# ${newDescription}` },
            ],
        },
        {
            type:       1,
            components: [
                { type: 2, label: 'Confirm overwrite', style: 4, custom_id: 'ec_upd_confirm' },
                { type: 2, label: '← Back',            style: 2, custom_id: 'ec_upd_conf_back' },
            ],
        },
    ];
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function buildUpdateFormComponents(state: EnvConditionUpdateState): object[] {
    if (state.modifierType === 'world')       return buildWorldForm(state);
    if (state.modifierType === 'stat')        return buildStatForm(state);
    if (state.modifierType === 'proficiency') return buildProfForm(state);
    return buildUpdateTypeSelector(state);
}
