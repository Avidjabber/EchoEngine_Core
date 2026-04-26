import { MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import type { ProficiencyAddState } from './addState';

export function buildPreviewCard(state: ProficiencyAddState, userId: string): object {
    const desc = state.description || '*(none)*';
    const content = [
        '## Add Proficiency',
        `Requested by <@${userId}>`,
        '',
        `**Name:** ${state.name}`,
        `**Code Name:** \`${state.codeName}\``,
        `**Stat:** ${state.stat}`,
        `**Description:** ${desc}`,
    ].join('\n');

    return {
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.info,
            components: [
                { type: 10, content },
                { type: 14, divider: true },
                {
                    type: 1,
                    components: [
                        { type: 2, style: 4, custom_id: 'prof_add_cancel',   label: 'Cancel'   },
                        { type: 2, style: 3, custom_id: 'prof_add_finalize', label: 'Finalize' },
                    ],
                },
            ],
        }],
    };
}
