import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { execute as denSet } from './den/set';
import { execute as denRemove } from './den/remove';
import { execute as denList } from './den/list';
import { execute as denConfig } from './den/config';
import { execute as settingsUpdate } from './settings/update';
import { execute as settingsInfo }   from './settings/info';
import { execute as settingsReset }  from './settings/reset';

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
            )
            .addSubcommand(sub =>
                sub
                    .setName('config')
                    .setDescription('Edit the settings for a registered Echo Den')
                    .addChannelOption(opt =>
                        opt
                            .setName('channel')
                            .setDescription('The den channel to configure')
                            .setRequired(true),
                    ),
            ),
    )
    .addSubcommandGroup(group =>
        group
            .setName('settings')
            .setDescription('Manage server-wide settings')
            .addSubcommand(sub =>
                sub
                    .setName('update')
                    .setDescription('View and update server-wide settings'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('info')
                    .setDescription('View the current server-wide settings'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('reset')
                    .setDescription('Reset all server-wide settings back to their defaults'),
            ),
    );

export const publicSubcommands = new Set(['reset']);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

    if (group === 'den' && sub === 'set')        return denSet(interaction);
    if (group === 'den' && sub === 'remove')     return denRemove(interaction);
    if (group === 'den' && sub === 'list')       return denList(interaction);
    if (group === 'den' && sub === 'config')     return denConfig(interaction);
    if (group === 'settings' && sub === 'update') return settingsUpdate(interaction);
    if (group === 'settings' && sub === 'info')   return settingsInfo(interaction);
    if (group === 'settings' && sub === 'reset')  return settingsReset(interaction);
}
