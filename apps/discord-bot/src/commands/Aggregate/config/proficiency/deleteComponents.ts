import { MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import type { ProficiencyDeleteState } from './deleteState';

export function buildDeleteConfirmCard(state: ProficiencyDeleteState, userId: string): object {
    const content = [
        '## Delete Proficiency',
        `Requested by <@${userId}>`,
        '',
        `Are you sure you want to delete **${state.name}** (\`${state.codeName}\`)?`,
        `-# This action cannot be undone.`,
    ].join('\n');

    return {
        flags: MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.error,
            components: [
                { type: 10, content },
                { type: 14, divider: true },
                {
                    type: 1,
                    components: [
                        { type: 2, style: 2, custom_id: 'prof_del_cancel',  label: 'Cancel'         },
                        { type: 2, style: 4, custom_id: 'prof_del_confirm', label: 'Confirm Delete'  },
                    ],
                },
            ],
        }],
    };
}
