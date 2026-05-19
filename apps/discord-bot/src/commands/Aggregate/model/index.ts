import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { execute as conditionsUpload }         from './conditions/upload';
import { execute as conditionsUploadSheet }    from './conditions/upload-sheet';
import { execute as conditionsTemplate }       from './conditions/template';
import { execute as conditionsDownload }       from './conditions/download';
import { execute as conditionsReset }          from './conditions/reset';
import { execute as envConditionsUpload }       from './envconditions/upload';
import { execute as envConditionsUploadSheet }  from './envconditions/upload-sheet';
import { execute as envConditionsTemplate }    from './envconditions/template';
import { execute as envConditionsDownload }    from './envconditions/download';
import { execute as envConditionsReset }       from './envconditions/reset';
import { execute as proficienciesUpload }       from './proficiencies/upload';
import { execute as proficienciesUploadSheet }  from './proficiencies/upload-sheet';
import { execute as proficienciesTemplate }    from './proficiencies/template';
import { execute as proficienciesDownload }     from './proficiencies/download';
import { execute as proficienciesReset }       from './proficiencies/reset';
import { execute as weatherStateUpload }       from './weatherstates/upload';
import { execute as weatherStateUploadSheet }  from './weatherstates/upload-sheet';
import { execute as weatherStateTemplate }     from './weatherstates/template';
import { execute as weatherStateDownload }     from './weatherstates/download';
import { execute as weatherStateReset }        from './weatherstates/reset';
import { execute as weatherPatternUpload }     from './weatherpatterns/upload';
import { execute as weatherPatternUploadSheet } from './weatherpatterns/upload-sheet';
import { execute as weatherPatternTemplate }   from './weatherpatterns/template';
import { execute as weatherPatternDownload }   from './weatherpatterns/download';
import { execute as weatherPatternReset }      from './weatherpatterns/reset';
import { execute as itemsUpload }              from './items/upload';
import { execute as itemsUploadSheet }         from './items/upload-sheet';
import { execute as itemsTemplate }            from './items/template';
import { execute as itemsDownload }            from './items/download';
import { execute as itemsReset }               from './items/reset';

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
                    .setName('upload-sheet')
                    .setDescription('Upload an env condition modifier pack from a Google Sheets link')
                    .addStringOption(opt =>
                        opt
                            .setName('link')
                            .setDescription('A Google Sheets share link (must be set to Anyone with the link can view)')
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
                    .setDescription('Reset env condition modifiers — omit to view the list, "all" to clear everything, or pass a codeName')
                    .addStringOption(opt =>
                        opt
                            .setName('condition')
                            .setDescription('"all" to reset everything, or a specific env condition codeName')
                            .setRequired(false),
                    ),
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
                    .setName('upload-sheet')
                    .setDescription('Upload a proficiency pack from a Google Sheets link')
                    .addStringOption(opt =>
                        opt
                            .setName('link')
                            .setDescription('A Google Sheets share link (must be set to Anyone with the link can view)')
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
                    .setName('download')
                    .setDescription('Download this guild\'s current proficiency config as an .xlsx file'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('reset')
                    .setDescription('Delete all proficiency definitions for this guild'),
            ),
    )
    .addSubcommandGroup(group =>
        group
            .setName('weatherstate')
            .setDescription('Manage guild weather state definitions')
            .addSubcommand(sub =>
                sub
                    .setName('upload')
                    .setDescription('Upload a weather state pack from an .xlsx file')
                    .addAttachmentOption(opt =>
                        opt
                            .setName('file')
                            .setDescription('The .xlsx pack file to upload')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('upload-sheet')
                    .setDescription('Upload a weather state pack from a Google Sheets link')
                    .addStringOption(opt =>
                        opt
                            .setName('link')
                            .setDescription('A Google Sheets share link (must be set to Anyone with the link can view)')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('template')
                    .setDescription('Download a blank .xlsx template for weather state packs'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('download')
                    .setDescription('Download this guild\'s current weather state config as an .xlsx file'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('reset')
                    .setDescription('Delete all weather state definitions for this guild'),
            ),
    )
    .addSubcommandGroup(group =>
        group
            .setName('weatherpattern')
            .setDescription('Manage guild weather pattern definitions')
            .addSubcommand(sub =>
                sub
                    .setName('upload')
                    .setDescription('Upload a weather pattern pack from an .xlsx file')
                    .addAttachmentOption(opt =>
                        opt
                            .setName('file')
                            .setDescription('The .xlsx pack file to upload')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('upload-sheet')
                    .setDescription('Upload a weather pattern pack from a Google Sheets link')
                    .addStringOption(opt =>
                        opt
                            .setName('link')
                            .setDescription('A Google Sheets share link (must be set to Anyone with the link can view)')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('template')
                    .setDescription('Download a blank .xlsx template for weather pattern packs'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('download')
                    .setDescription('Download this guild\'s current weather pattern config as an .xlsx file'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('reset')
                    .setDescription('Delete all weather pattern definitions for this guild'),
            ),
    )
    .addSubcommandGroup(group =>
        group
            .setName('items')
            .setDescription('Manage guild item definitions')
            .addSubcommand(sub =>
                sub
                    .setName('upload')
                    .setDescription('Upload an item pack from an .xlsx file')
                    .addAttachmentOption(opt =>
                        opt
                            .setName('file')
                            .setDescription('The .xlsx pack file to upload')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('upload-sheet')
                    .setDescription('Upload an item pack from a Google Sheets link')
                    .addStringOption(opt =>
                        opt
                            .setName('link')
                            .setDescription('A Google Sheets share link (must be set to Anyone with the link can view)')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('template')
                    .setDescription('Download a blank .xlsx template for item packs'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('download')
                    .setDescription('Download this guild\'s current item config as an .xlsx file'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('reset')
                    .setDescription('Delete all item definitions for this guild'),
            ),
    )
    .addSubcommandGroup(group =>
        group
            .setName('conditions')
            .setDescription('Manage guild condition definitions')
            .addSubcommand(sub =>
                sub
                    .setName('upload')
                    .setDescription('Upload a condition pack from an .xlsx file')
                    .addAttachmentOption(opt =>
                        opt
                            .setName('file')
                            .setDescription('The .xlsx pack file to upload')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('upload-sheet')
                    .setDescription('Upload a condition pack from a Google Sheets link')
                    .addStringOption(opt =>
                        opt
                            .setName('link')
                            .setDescription('A Google Sheets share link (must be set to Anyone with the link can view)')
                            .setRequired(true),
                    ),
            )
            .addSubcommand(sub =>
                sub
                    .setName('template')
                    .setDescription('Download a blank .xlsx template for condition packs'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('download')
                    .setDescription('Download this guild\'s current condition config as an .xlsx file'),
            )
            .addSubcommand(sub =>
                sub
                    .setName('reset')
                    .setDescription('Delete all guild-defined condition definitions for this guild'),
            ),
    );

export const publicSubcommands = new Set(['upload', 'upload-sheet', 'template', 'download', 'reset']);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

    if (group === 'envconditions' && sub === 'upload')        return envConditionsUpload(interaction);
    if (group === 'envconditions' && sub === 'upload-sheet') return envConditionsUploadSheet(interaction);
    if (group === 'envconditions' && sub === 'template')     return envConditionsTemplate(interaction);
    if (group === 'envconditions' && sub === 'download')     return envConditionsDownload(interaction);
    if (group === 'envconditions' && sub === 'reset')        return envConditionsReset(interaction);

    if (group === 'proficiencies' && sub === 'upload')        return proficienciesUpload(interaction);
    if (group === 'proficiencies' && sub === 'upload-sheet') return proficienciesUploadSheet(interaction);
    if (group === 'proficiencies' && sub === 'template')     return proficienciesTemplate(interaction);
    if (group === 'proficiencies' && sub === 'download')     return proficienciesDownload(interaction);
    if (group === 'proficiencies' && sub === 'reset')        return proficienciesReset(interaction);

    if (group === 'weatherstate' && sub === 'upload')        return weatherStateUpload(interaction);
    if (group === 'weatherstate' && sub === 'upload-sheet') return weatherStateUploadSheet(interaction);
    if (group === 'weatherstate' && sub === 'template')     return weatherStateTemplate(interaction);
    if (group === 'weatherstate' && sub === 'download')     return weatherStateDownload(interaction);
    if (group === 'weatherstate' && sub === 'reset')        return weatherStateReset(interaction);

    if (group === 'weatherpattern' && sub === 'upload')        return weatherPatternUpload(interaction);
    if (group === 'weatherpattern' && sub === 'upload-sheet') return weatherPatternUploadSheet(interaction);
    if (group === 'weatherpattern' && sub === 'template')     return weatherPatternTemplate(interaction);
    if (group === 'weatherpattern' && sub === 'download')     return weatherPatternDownload(interaction);
    if (group === 'weatherpattern' && sub === 'reset')        return weatherPatternReset(interaction);

    if (group === 'items' && sub === 'upload')        return itemsUpload(interaction);
    if (group === 'items' && sub === 'upload-sheet') return itemsUploadSheet(interaction);
    if (group === 'items' && sub === 'template')     return itemsTemplate(interaction);
    if (group === 'items' && sub === 'download')     return itemsDownload(interaction);
    if (group === 'items' && sub === 'reset')        return itemsReset(interaction);

    if (group === 'conditions' && sub === 'upload')        return conditionsUpload(interaction);
    if (group === 'conditions' && sub === 'upload-sheet') return conditionsUploadSheet(interaction);
    if (group === 'conditions' && sub === 'template')     return conditionsTemplate(interaction);
    if (group === 'conditions' && sub === 'download')     return conditionsDownload(interaction);
    if (group === 'conditions' && sub === 'reset')        return conditionsReset(interaction);
}
