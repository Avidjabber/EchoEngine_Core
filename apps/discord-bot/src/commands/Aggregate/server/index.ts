import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { execute as denSet } from './den/set';
import { execute as denRemove } from './den/remove';
import { execute as denList } from './den/list';

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
            )
            .addSubcommand(sub =>
                sub
                    .setName('remove')
                    .setDescription('Remove this channel as an Echo Den'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('list')
                    .setDescription('List all registered Echo Dens in this server'),
            ),
    );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

    if (group === 'den' && sub === 'set')    return denSet(interaction);
    if (group === 'den' && sub === 'remove') return denRemove(interaction);
    if (group === 'den' && sub === 'list')   return denList(interaction);
}
