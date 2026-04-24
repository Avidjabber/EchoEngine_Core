import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { execute as envConditionsUpload }      from './envconditions/upload';
import { execute as envConditionsTemplate }    from './envconditions/template';
import { execute as envConditionsDownload }    from './envconditions/download';
import { execute as envConditionsReset }       from './envconditions/reset';
import { execute as proficienciesUpload }      from './proficiencies/upload';
import { execute as proficienciesTemplate }    from './proficiencies/template';
import { execute as proficienciesReset }       from './proficiencies/reset';

export const data = new SlashCommandBuilder()
    .setName('model')
    .setDescription('Bulk upload and download guild configuration packs')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommandGroup(group =>
        group
            .setName('envconditions')
            .setDescription('Manage env condition modifier packs')
            .addSubcommand(sub =>
                sub
                    .setName('upload')
                    .setDescription('Upload an env condition modifier pack from an .xlsx file')
                    .addAttachmentOption(opt =>
                        opt
                            .setName('file')
                            .setDescription('The .xlsx pack file to upload')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('template')
                    .setDescription('Download a blank .xlsx template for env condition modifier packs'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('download')
                    .setDescription('Download this guild\'s current env condition modifier config as an .xlsx file'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('reset')
                    .setDescription('Delete all env condition modifiers for this guild'),
            ),
    )
    .addSubcommandGroup(group =>
        group
            .setName('proficiencies')
            .setDescription('Manage guild proficiency definitions')
            .addSubcommand(sub =>
                sub
                    .setName('upload')
                    .setDescription('Upload a proficiency pack from an .xlsx file')
                    .addAttachmentOption(opt =>
                        opt
                            .setName('file')
                            .setDescription('The .xlsx pack file to upload')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('template')
                    .setDescription('Download a blank .xlsx template for proficiency packs'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('reset')
                    .setDescription('Delete all proficiency definitions for this guild'),
            ),
    );

export const publicSubcommands = new Set(['upload', 'template', 'download', 'reset']);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

    if (group === 'envconditions' && sub === 'upload')   return envConditionsUpload(interaction);
    if (group === 'envconditions' && sub === 'template') return envConditionsTemplate(interaction);
    if (group === 'envconditions' && sub === 'download') return envConditionsDownload(interaction);
    if (group === 'envconditions' && sub === 'reset')    return envConditionsReset(interaction);

    if (group === 'proficiencies' && sub === 'upload')   return proficienciesUpload(interaction);
    if (group === 'proficiencies' && sub === 'template') return proficienciesTemplate(interaction);
    if (group === 'proficiencies' && sub === 'reset')    return proficienciesReset(interaction);
}
