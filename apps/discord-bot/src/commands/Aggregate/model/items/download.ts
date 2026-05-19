import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchItemDownloadData } from '../../../../services/model/itemPackService';
import { generateItemDownload } from '../../../../utils/generators/itemTemplate';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchItemDownloadData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const data = result.value!;

    let buffer: Buffer;
    try {
        buffer = await generateItemDownload(data);
    } catch {
        await replyError(interaction, 'Failed to generate the download file. Please try again.');
        return;
    }

    const attachment  = new AttachmentBuilder(buffer, { name: 'items.xlsx' });
    const itemCount   = data.items.length;
    const equipCount  = data.equipment.length;
    const actionCount = data.actions.length;

    const summary = itemCount === 0
        ? 'No items are configured for this guild yet.'
        : [
            `## Item Config Export`,
            `-# ${itemCount} item${itemCount !== 1 ? 's' : ''}`,
            `-# ${equipCount} equipment profile${equipCount !== 1 ? 's' : ''}`,
            `-# ${actionCount} action${actionCount !== 1 ? 's' : ''}`,
          ].join('\n');

    await interaction.editReply({
        content: 'Here is your current item config.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
            {
                type:         17,
                accent_color: itemCount === 0 ? colors.info : colors.success,
                components:   [{ type: 10, content: summary }],
            },
        ],
    } as never);
}
