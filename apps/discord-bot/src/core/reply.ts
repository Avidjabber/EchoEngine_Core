import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    MessageFlags,
    TextDisplayBuilder,
} from 'discord.js';
import { colors } from './colors';

/**
 * Send an error message to an interaction using v2 components.
 * Handles both un-replied and already-deferred interactions automatically.
 */
export async function replyError(
    interaction: ChatInputCommandInteraction,
    content: string,
): Promise<void> {
    const container = new ContainerBuilder()
        .setAccentColor(colors.error)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content),
        );

    const payload = {
        flags:      MessageFlags.IsComponentsV2,
        components: [container],
    };

    if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ ...payload, flags: payload.flags | MessageFlags.Ephemeral });
    } else {
        await interaction.editReply(payload as never);
    }
}
