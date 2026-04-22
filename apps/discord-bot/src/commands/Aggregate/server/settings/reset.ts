import { ChatInputCommandInteraction, ContainerBuilder, MessageFlags, TextDisplayBuilder } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { resetGuildSettings } from '../../../../services/server/settingsService';
import { invalidateInfoCache } from './infoState';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId!;

    const placeholder = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(messages.guildSettingsResetting),
        );

    await interaction.reply({
        flags:      MessageFlags.IsComponentsV2,
        components: [placeholder],
    });

    const result = await resetGuildSettings(guildId);

    if (!result.success) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messages.errorGeneric),
                    ),
            ],
        });
        return;
    }

    invalidateInfoCache(guildId);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [
            new ContainerBuilder()
                .setAccentColor(colors.success)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        messages.guildSettingsReset(interaction.user.id),
                    ),
                ),
        ],
    });
}
