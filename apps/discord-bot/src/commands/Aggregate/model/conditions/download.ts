import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchConditionDownloadData } from '../../../../services/model/conditionPackService';
import { generateConditionDownload } from '../../../../utils/generators/conditionTemplate';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchConditionDownloadData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const data = result.value!;

    let buffer: Buffer;
    try {
        buffer = await generateConditionDownload(data);
    } catch {
        await replyError(interaction, 'Failed to generate the download file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'conditions.xlsx' });
    const count      = data.conditions.length;

    const summary = count === 0
        ? 'No conditions are configured for this guild yet.'
        : [
            `## Condition Config Export`,
            `-# ${count} condition${count !== 1 ? 's' : ''}`,
            `-# ${data.statEffects.length} stat effect${data.statEffects.length !== 1 ? 's' : ''}`,
            `-# ${data.behaviorEffects.length} behavior effect${data.behaviorEffects.length !== 1 ? 's' : ''}`,
            `-# Engine-owned conditions are not included in this export.`,
          ].join('\n');

    await interaction.editReply({
        content: 'Here is your current condition config.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
            {
                type:         17,
                accent_color: count === 0 ? colors.info : colors.success,
                components:   [{ type: 10, content: summary }],
            },
        ],
    } as never);
}
