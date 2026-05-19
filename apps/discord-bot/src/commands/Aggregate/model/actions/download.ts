import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchActionDownloadData } from '../../../../services/model/actionPackService';
import { generateActionDownload } from '../../../../utils/generators/actionTemplate';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchActionDownloadData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const data = result.value!;

    let buffer: Buffer;
    try {
        buffer = await generateActionDownload(data);
    } catch {
        await replyError(interaction, 'Failed to generate the download file. Please try again.');
        return;
    }

    const attachment    = new AttachmentBuilder(buffer, { name: 'actions.xlsx' });
    const configCount   = data.baseConfigs.length;
    const rewardCount   = data.disciplineRewards.length;
    const stepCount     = data.stepConfigs.length;
    const reqCount      = data.disciplineRequirements.length;

    const summary = configCount === 0
        ? 'No actions are configured for this guild yet.'
        : [
            `## Action Config Export`,
            `-# ${configCount} action${configCount !== 1 ? 's' : ''} configured`,
            `-# ${rewardCount} discipline reward${rewardCount !== 1 ? 's' : ''}`,
            `-# ${stepCount} step config${stepCount !== 1 ? 's' : ''}`,
            `-# ${reqCount} discipline requirement${reqCount !== 1 ? 's' : ''}`,
          ].join('\n');

    await interaction.editReply({
        content: 'Here is your current action config.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
            {
                type:         17,
                accent_color: configCount === 0 ? colors.info : colors.success,
                components:   [{ type: 10, content: summary }],
            },
        ],
    } as never);
}
