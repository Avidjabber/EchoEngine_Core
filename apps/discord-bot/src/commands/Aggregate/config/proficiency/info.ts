import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { replyLoading } from '../../../../core/reply';
import { fetchProficiencyByCodeName } from '../../../../services/model/proficiencyPackService';
import { buildStandaloneInfoComponents } from './infoComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId  = interaction.guildId!;
    const codeName = interaction.options.getString('codename', true);

    const result = await fetchProficiencyByCodeName(guildId, codeName);

    if (!result.success) {
        const isNotFound = result.error?.code === 'HTTP_404';
        const content    = isNotFound
            ? `\`${codeName}\` is not a recognised proficiency codeName.`
            : '*"Oh dear, something went wrong..."*';

        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: 0xe74c3c, components: [{ type: 10, content }] }],
        } as never);
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildStandaloneInfoComponents(result.value!) as never,
    });
}
