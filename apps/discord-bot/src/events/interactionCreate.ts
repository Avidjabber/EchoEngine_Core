import { Client, ContainerBuilder, Interaction, MessageFlags, TextDisplayBuilder } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../core/colors';
import { getDens } from '../services/server/denService';
import { getCachedDens, setCachedDens } from '../services/server/denCache';
import { modalHandlers, selectMenuHandlers, buttonHandlers } from '../handlers/componentRegistry';
import type { ComponentHandler } from '../handlers/componentRegistry';

function dispatch(handlers: ComponentHandler[], interaction: Interaction): Promise<void> | void {
    if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) return;
    const entry = handlers.find(h => interaction.customId.startsWith(h.prefix));
    if (entry) return entry.handler(interaction);
}

function isDenManagementCommand(interaction: Interaction): boolean {
    if (!interaction.isChatInputCommand()) return false;
    const EXEMPT_SUBCOMMANDS = new Set(['set', 'remove', 'list', 'config']);
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
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command?.autocomplete) return;
        try {
            await command.autocomplete(interaction);
        } catch (err) {
            console.error('Unhandled error in autocomplete handler:', err);
        }
        return;
    }

    if (interaction.isModalSubmit() || interaction.isStringSelectMenu() || interaction.isButton()) {
        const handlers = interaction.isModalSubmit()      ? modalHandlers
                       : interaction.isStringSelectMenu() ? selectMenuHandlers
                       : buttonHandlers;
        try {
            await dispatch(handlers, interaction);
        } catch (err) {
            if ((err as { code?: number }).code !== 10062) {
                console.error('Unhandled error in component handler:', err);
            }
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        // ── Den guard ────────────────────────────────────────────────────────
        // /server den set is the only command exempt from den validation.
        // All other commands must be run inside a registered den channel.
        if (!isDenManagementCommand(interaction)) {
            let dens = getCachedDens(interaction.guildId!);
            if (!dens) {
                const densResult = await getDens(interaction.guildId!);
                dens = densResult.success ? (densResult.value ?? []) : [];
                if (densResult.success) setCachedDens(interaction.guildId!, dens);
            }

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
            const deferContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(messages.deferMessage),
                );
            await interaction.reply({
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [deferContainer],
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
