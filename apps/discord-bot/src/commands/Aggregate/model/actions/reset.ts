import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { resetActionPack } from '../../../../services/model/actionPackService';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

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
                            '## Reset Action Config',
                            'This will permanently delete **all** action configuration for this guild.',
                            '-# Base configs, discipline rewards, step configs, and discipline requirements will all be cleared.',
                            '-# Actions will become unavailable to your guild until reconfigured.',
                            '-# This action cannot be undone.',
                        ].join('\n'),
                    },
                    {
                        type:       1,
                        components: [
                            { type: 2, style: 4, label: 'Confirm Reset', custom_id: 'actions_reset_confirm' },
                            { type: 2, style: 2, label: 'Cancel',        custom_id: 'actions_reset_cancel'  },
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
        await interaction.deleteReply();
        return;
    }

    if (confirmation.customId === 'actions_reset_cancel') {
        await interaction.deleteReply();
        return;
    }

    await confirmation.deferUpdate();

    const guildId = interaction.guildId!;
    const result  = await resetActionPack(guildId);

    if (!result.success) {
        await replyError(interaction, 'Failed to reset action config. Please try again.');
        return;
    }

    const { deletedBaseConfigs, deletedDisciplineRewards, deletedStepConfigs, deletedDisciplineRequirements } = result.value!;
    const userId = interaction.user.id;
    const total  = deletedBaseConfigs + deletedDisciplineRewards + deletedStepConfigs + deletedDisciplineRequirements;

    const annoLines = [
        '## Action Config Reset',
        `Reset by <@${userId}>`,
        '',
    ];

    if (total === 0) {
        annoLines.push('-# No action config was set — nothing was cleared.');
    } else {
        if (deletedBaseConfigs            > 0) annoLines.push(`**${deletedBaseConfigs}** base config${deletedBaseConfigs !== 1 ? 's' : ''} removed`);
        if (deletedDisciplineRewards      > 0) annoLines.push(`**${deletedDisciplineRewards}** discipline reward${deletedDisciplineRewards !== 1 ? 's' : ''} removed`);
        if (deletedStepConfigs            > 0) annoLines.push(`**${deletedStepConfigs}** step config${deletedStepConfigs !== 1 ? 's' : ''} removed`);
        if (deletedDisciplineRequirements > 0) annoLines.push(`**${deletedDisciplineRequirements}** discipline requirement${deletedDisciplineRequirements !== 1 ? 's' : ''} removed`);
    }

    const annoColor = total === 0 ? colors.info : colors.success;

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: annoColor, components: [{ type: 10, content: annoLines.join('\n') }] }],
    } as never);

    await interaction.deleteReply();
}
