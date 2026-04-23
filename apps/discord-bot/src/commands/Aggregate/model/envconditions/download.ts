import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError } from '../../../../core/reply';
import { fetchEnvConditionDownloadData } from '../../../../services/model/envConditionPackService';
import { generateEnvConditionDownload } from '../../../../utils/generators/envConditionTemplate';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId!;
    const result  = await fetchEnvConditionDownloadData(guildId);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const data = result.value!;

    let buffer: Buffer;
    try {
        buffer = await generateEnvConditionDownload(data);
    } catch {
        await replyError(interaction, 'Failed to generate the download file. Please try again.');
        return;
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'env-conditions.xlsx' });

    const worldCount = data.worldModifiers.length;
    const statCount  = data.statModifiers.length;
    const profCount  = data.proficiencyModifiers.length;
    const total      = worldCount + statCount + profCount;

    const summary = total === 0
        ? 'No env condition modifiers are configured for this guild yet.'
        : [
            `## Env Condition Config Export`,
            `-# ${worldCount} world modifier${worldCount !== 1 ? 's' : ''}`,
            `-# ${statCount} stat modifier${statCount !== 1 ? 's' : ''}`,
            `-# ${profCount} proficiency modifier${profCount !== 1 ? 's' : ''}`,
          ].join('\n');

    await interaction.editReply({
        content: 'Here is your current env condition modifier config.',
        files:   [attachment],
    });

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
            {
                type:         17,
                accent_color: total === 0 ? colors.info : colors.success,
                components:   [{ type: 10, content: summary }],
            },
        ],
    } as never);
}
