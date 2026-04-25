import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError } from '../../../../core/reply';
import { fetchProficiencyTemplateData } from '../../../../services/model/proficiencyPackService';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await replyError(interaction, messages.invalidPerms);
        return;
    }

    const templateResult = await fetchProficiencyTemplateData(interaction.guildId!);
    if (!templateResult.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const { stats } = templateResult.value!;

    await interaction.showModal({
        title:      'Add Proficiency',
        custom_id:  'prof_add_modal',
        components: [
            {
                type:      18,
                label:     'Name',
                component: { type: 4, custom_id: 'name', style: 1, max_length: 100, required: true, placeholder: 'e.g. Athletic' },
            },
            {
                type:        18,
                label:       'Code Name',
                description: 'Lowercase: a–z, 0–9, _ (must start with a letter)',
                component:   { type: 4, custom_id: 'code_name', style: 1, max_length: 50, required: true, placeholder: 'e.g. athletic' },
            },
            {
                type:      18,
                label:     'Stat',
                component: {
                    type:      21,
                    custom_id: 'stat',
                    required:  true,
                    options:   stats.map(s => ({ value: s, label: s })),
                },
            },
            {
                type:        18,
                label:       'Description',
                description: 'Optional — leave blank to skip',
                component:   { type: 4, custom_id: 'description', style: 2, max_length: 500, required: false },
            },
        ],
    } as never);
}
