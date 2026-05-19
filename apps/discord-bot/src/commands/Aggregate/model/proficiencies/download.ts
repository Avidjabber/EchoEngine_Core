import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchProficiencyDownloadData } from '../../../../services/model/proficiencyPackService';
import { generateProficiencyDownload } from '../../../../utils/generators/proficiencyTemplate';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const result  = await fetchProficiencyDownloadData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const { proficiencies, templateData } = result.value!;

    let buffer: Buffer;
    try {
        buffer = await generateProficiencyDownload(proficiencies, templateData);
    } catch {
        await replyError(interaction, 'Failed to generate the download file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'proficiencies.xlsx' });
    const count      = proficiencies.length;

    const summary = count === 0
        ? 'No proficiencies are configured for this guild yet.'
        : [
            `## Proficiency Config Export`,
            `-# ${count} proficien${count !== 1 ? 'cies' : 'cy'}`,
          ].join('\n');

    await interaction.editReply({
        content: 'Here is your current proficiency config.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
            {
                type:         17,
                accent_color: count === 0 ? colors.info : colors.success,
                components:   [{ type: 10, content: summary }],
            },
        ],
    } as never);
}
