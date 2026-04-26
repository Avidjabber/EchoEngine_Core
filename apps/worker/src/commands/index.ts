import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Manage the ticker.')

export const publicSubcommands  = new Set([]);
export const modalSubcommands   = new Set([]);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

}
