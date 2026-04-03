import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { execute as denSet } from './den/set';

export const data = new SlashCommandBuilder()
    .setName('server')
    .setDescription('Server management commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommandGroup(group =>
        group
            .setName('den')
            .setDescription('Manage Echo Dens')
            .addSubcommand(sub =>
                sub
                    .setName('set')
                    .setDescription('Register this channel as an Echo Den'),
            ),
    );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

    if (group === 'den' && sub === 'set') return denSet(interaction);
}
