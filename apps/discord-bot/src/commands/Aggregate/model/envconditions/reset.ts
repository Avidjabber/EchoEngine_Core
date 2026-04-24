import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError } from '../../../../core/reply';
import { resetEnvConditionPack } from '../../../../services/model/envConditionPackService';
import { invalidateEnvConditionInfoCache } from '../../config/envcondition/infoState';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [
            {
                type:         17,
                accent_color: colors.error,
                components:   [
                    {
                        type:    10,
                        content: [
                            '## Reset Env Condition Modifiers',
                            'This will permanently delete **all** world, stat, and proficiency modifiers for this guild.',
                            '-# This action cannot be undone.',
                        ].join('\n'),
                    },
                    {
                        type:       1,
                        components: [
                            { type: 2, style: 4, label: 'Confirm Reset', custom_id: 'envconditions_reset_confirm' },
                            { type: 2, style: 2, label: 'Cancel',        custom_id: 'envconditions_reset_cancel'  },
                        ],
                    },
                ],
            },
        ],
    } as never);

    const reply = await interaction.fetchReply();

    let confirmation: import('discord.js').MessageComponentInteraction;
    try {
        confirmation = await reply.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id,
            time:   30_000,
        });
    } catch {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [
                {
                    type:         17,
                    accent_color: colors.info,
                    components:   [{ type: 10, content: 'Reset timed out. No changes were made.' }],
                },
            ],
        } as never);
        return;
    }

    if (confirmation.customId === 'envconditions_reset_cancel') {
        await confirmation.update({
            flags:      MessageFlags.IsComponentsV2,
            components: [
                {
                    type:         17,
                    accent_color: colors.info,
                    components:   [{ type: 10, content: 'Reset cancelled. No changes were made.' }],
                },
            ],
        } as never);
        return;
    }

    await confirmation.deferUpdate();

    const guildId = interaction.guildId!;
    const result  = await resetEnvConditionPack(guildId);

    if (!result.success) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [
                {
                    type:         17,
                    accent_color: colors.error,
                    components:   [{ type: 10, content: messages.errorGeneric }],
                },
            ],
        } as never);
        return;
    }

    invalidateEnvConditionInfoCache(guildId);

    const { worldModifiers, statModifiers, proficiencyModifiers } = result.value!;
    const total = worldModifiers + statModifiers + proficiencyModifiers;

    const summary = total === 0
        ? 'No env condition modifiers were configured — nothing to clear.'
        : [
            '## Env Condition Modifiers Cleared',
            `-# ${worldModifiers} world modifier${worldModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${statModifiers} stat modifier${statModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${proficiencyModifiers} proficiency modifier${proficiencyModifiers !== 1 ? 's' : ''} deleted`,
          ].join('\n');

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [
            {
                type:         17,
                accent_color: total === 0 ? colors.info : colors.success,
                components:   [{ type: 10, content: summary }],
            },
        ],
    } as never);
}
