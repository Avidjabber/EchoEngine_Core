import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    MessageFlags,
    TextDisplayBuilder,
} from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError } from '../../../../core/reply';
import { getDens } from '../../../../services/server/denService';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const result = await getDens(interaction.guildId!);

    if (!result.success) {
        await replyError(interaction, messages.apiError(result.error!));
        return;
    }

    const dens = result.value ?? [];

    if (!dens.length) {
        await replyError(interaction, messages.noDens);
        return;
    }

    const denList = dens.map(d => `- <#${d.channelId}>`).join('\n');

    const container = new ContainerBuilder()
        .setAccentColor(colors.info)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Echo Dens\n${denList}`),
        );

    await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
    });
}
