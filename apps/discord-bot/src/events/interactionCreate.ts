import { Client, ContainerBuilder, Interaction, MessageFlags, TextDisplayBuilder } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../core/colors';
import { getDens } from '../services/server/denService';
import { modalHandlers, selectMenuHandlers, buttonHandlers } from '../handlers/componentRegistry';
import type { ComponentHandler } from '../handlers/componentRegistry';

function dispatch(handlers: ComponentHandler[], interaction: Interaction): Promise<void> | void {
    if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) return;
    const entry = handlers.find(h => interaction.customId.startsWith(h.prefix));
    if (entry) return entry.handler(interaction);
}

function isDenManagementCommand(interaction: Interaction): boolean {
    if (!interaction.isChatInputCommand()) return false;
    const EXEMPT_SUBCOMMANDS = new Set(['set', 'remove']);
    return (
        interaction.commandName === 'server' &&
        interaction.options.getSubcommandGroup(false) === 'den' &&
        EXEMPT_SUBCOMMANDS.has(interaction.options.getSubcommand(false) ?? '')
    );
}

async function replyDenRestricted(interaction: Interaction, content: string): Promise<void> {
    if (!interaction.isRepliable()) return;
    const container = new ContainerBuilder()
        .setAccentColor(colors.error)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content),
        );
    await interaction.reply({
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        components: [container],
    });
}

export default async function interactionCreate(
    interaction: Interaction,
    client: Client,
): Promise<void> {
    if (interaction.isModalSubmit())      return dispatch(modalHandlers, interaction);
    if (interaction.isStringSelectMenu()) return dispatch(selectMenuHandlers, interaction);
    if (interaction.isButton())           return dispatch(buttonHandlers, interaction);

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        // ── Den guard ────────────────────────────────────────────────────────
        // /server den set is the only command exempt from den validation.
        // All other commands must be run inside a registered den channel.
        if (!isDenManagementCommand(interaction)) {
            const densResult = await getDens(interaction.guildId!);
            const dens = densResult.success ? (densResult.value ?? []) : [];

            if (!dens.length) {
                await replyDenRestricted(interaction, messages.denNotSet);
                return;
            }

            if (!dens.some(d => d.channelId === interaction.channelId)) {
                await replyDenRestricted(interaction, messages.denRestricted);
                return;
            }
        }

        // ── Auto-defer ───────────────────────────────────────────────────────
        const subcommandName = interaction.options.getSubcommand(false);
        const subUsesModal   = subcommandName && command.modalSubcommands?.has(subcommandName);
        const subIsPublic    = subcommandName && command.publicSubcommands?.has(subcommandName);

        if (!command.usesModal && !subUsesModal && !subIsPublic) {
            await interaction.reply({
                content: messages.deferMessage,
                flags: MessageFlags.Ephemeral,
            });
        }

        await command.execute(interaction);

    } catch (err) {
        console.error(`Error executing /${interaction.commandName}:`, err);
        if ((err as { code?: number }).code === 10062) return; // interaction token expired

        const container = new ContainerBuilder()
            .setAccentColor(colors.error)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messages.errorGeneric),
            );
        const payload = {
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [container],
        };
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(payload).catch(() => null);
        } else {
            await interaction.reply(payload).catch(() => null);
        }
    }
}
