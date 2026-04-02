import { Client, Interaction, MessageFlags } from 'discord.js';
import { messages } from '../core/messages';
import { modalHandlers, selectMenuHandlers, buttonHandlers } from '../handlers/componentRegistry';
import type { ComponentHandler } from '../handlers/componentRegistry';

function dispatch(handlers: ComponentHandler[], interaction: Interaction): Promise<void> | void {
    if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) return;
    const entry = handlers.find(h => interaction.customId.startsWith(h.prefix));
    if (entry) return entry.handler(interaction);
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
        // ── Den validation ──────────────────────────────────────────────────
        // TODO: replace with a service call to the API
        // e.g. const dens = await denService.getDens(interaction.guildId!);
        //
        // if (!dens.length && interaction.commandName !== 'den') {
        //     return interaction.reply({ content: messages.denNotSet, flags: MessageFlags.Ephemeral });
        // }
        // const subcommand = interaction.options.getSubcommand(false);
        // const isAdmin    = interaction.memberPermissions?.has('ManageGuild') ?? false;
        // const isDenExempt = subcommand === 'set' || (subcommand === 'list' && isAdmin);
        // if (dens.length && !dens.some(d => d.channelId === interaction.channelId) && !isDenExempt) {
        //     return interaction.reply({ content: messages.denRestricted, flags: MessageFlags.Ephemeral });
        // }

        // ── Auto-defer ──────────────────────────────────────────────────────
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

        const payload = { content: messages.errorGeneric, flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(payload).catch(() => null);
        } else {
            await interaction.reply(payload).catch(() => null);
        }
    }
}
