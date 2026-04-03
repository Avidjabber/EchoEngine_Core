import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    GuildTextBasedChannel,
    MessageFlags,
    TextDisplayBuilder,
} from 'discord.js';
import { messages, errorCodes } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError } from '../../../../core/reply';
import { removeDen } from '../../../../services/server/denService';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId   = interaction.guildId!;
    const channelId = interaction.channelId;
    const channel   = interaction.channel as GuildTextBasedChannel;

    const result = await removeDen(guildId, channelId);

    if (!result.success) {
        const text = result.error?.code === errorCodes.DEN_NOT_FOUND
            ? messages.denNotFound
            : messages.denRegistrationFailed(result.error?.description ?? 'Unknown error');

        await replyError(interaction, text);
        return;
    }

    const announcement = new ContainerBuilder()
        .setAccentColor(colors.info)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(messages.denRemoved(channelId)),
        );

    await channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [announcement],
    });

    await interaction.deleteReply();
}
