import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { execute as envConditionsUpload } from './envconditions/upload';

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
            ),
    );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const group = interaction.options.getSubcommandGroup();
    const sub   = interaction.options.getSubcommand();

    if (group === 'envconditions' && sub === 'upload') return envConditionsUpload(interaction);
}
