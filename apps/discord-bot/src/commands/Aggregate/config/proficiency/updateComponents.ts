import { MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import type { ProficiencyUpdateState } from './updateState';

function buildActionRow(disabled: boolean): object {
    return {
        type: 1,
        components: [
            { type: 2, style: 4, custom_id: 'prof_upd_cancel',   label: 'Cancel',   disabled },
            { type: 2, style: 2, custom_id: 'prof_upd_update',   label: 'Update',   disabled },
            { type: 2, style: 3, custom_id: 'prof_upd_finalize', label: 'Finalize', disabled },
        ],
    };
}

export function buildUpdatePreviewCard(state: ProficiencyUpdateState, userId: string, disabled = false): object {
    const desc = state.description || '*(none)*';
    const content = [
        '## Update Proficiency',
        `Requested by <@${userId}>`,
        '',
        `**Name:** ${state.name}`,
        `**Code Name:** \`${state.codeName}\``,
        `**Stat:** ${state.stat}`,
        `**Description:** ${desc}`,
    ].join('\n');

    return {
        flags: MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.info,
            components: [
                { type: 10, content },
                { type: 14, divider: true },
                buildActionRow(disabled),
            ],
        }],
    };
}

export function buildUpdateModal(state: ProficiencyUpdateState): object {
    return {
        title:      'Update Proficiency',
        custom_id:  'prof_upd_modal',
        components: [
            {
                type:      18,
                label:     'Name',
                component: { type: 4, custom_id: 'name', style: 1, max_length: 100, required: true, value: state.name },
            },
            {
                type:        18,
                label:       'Code Name',
                description: 'Lowercase: a–z, 0–9, _ (must start with a letter)',
                component:   { type: 4, custom_id: 'code_name', style: 1, max_length: 50, required: true, value: state.codeName },
            },
            {
                type:      18,
                label:     'Stat',
                component: {
                    type:      21,
                    custom_id: 'stat',
                    required:  true,
                    options:   state.statOptions.map(s => ({ value: s, label: s, default: s === state.stat })),
                },
            },
            {
                type:        18,
                label:       'Description',
                description: 'Optional — leave blank to clear',
                component:   { type: 4, custom_id: 'description', style: 2, max_length: 500, required: false, value: state.description },
            },
        ],
    };
}
