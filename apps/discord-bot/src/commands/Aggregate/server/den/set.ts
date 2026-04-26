import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ContainerBuilder,
    GuildTextBasedChannel,
    MessageFlags,
    SeparatorBuilder,
    TextDisplayBuilder,
} from 'discord.js';
import { messages, errorCodes } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError } from '../../../../core/reply';
import { createDen } from '../../../../services/server/denService';
import { addCachedDen } from '../../../../services/server/denCache';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId   = interaction.guildId!;
    const channelId = interaction.channelId;
    const channel   = interaction.channel as GuildTextBasedChannel;

    const result = await createDen(guildId, channelId);

    if (!result.success) {
        const isDuplicate = result.error?.code === errorCodes.DEN_ALREADY_EXISTS;
        const errorText   = isDuplicate
            ? messages.denAlreadyRegistered(channelId)
            : messages.denRegistrationFailed(result.error?.description ?? 'Unknown error');

        await replyError(interaction, errorText);
        return;
    }

    addCachedDen(guildId, result.value!.den);

    // Public announcement in the channel
    const announcement = new ContainerBuilder()
        .setAccentColor(colors.success)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(messages.denRegistered),
        );

    await channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [announcement],
    });

    if (result.value?.firstTimeSetup) {
        const welcome = new ContainerBuilder()
            .setAccentColor(colors.special)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messages.welcomeHeader),
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messages.welcomeBody),
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messages.welcomeCta),
            )
            .addActionRowComponents(
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setLabel('Feedback')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://github.com/Avidjabber/EchoEngine_Core/issues'),
                    new ButtonBuilder()
                        .setLabel('Modules')
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('modules_placeholder')
                        .setDisabled(true),
                ),
            );

        await channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [welcome],
        });
    }

    // Remove the ephemeral reply — the public announcement is the only confirmation needed
    await interaction.deleteReply();
}
