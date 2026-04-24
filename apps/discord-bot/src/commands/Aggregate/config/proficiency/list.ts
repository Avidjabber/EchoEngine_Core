import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyLoading } from '../../../../core/reply';
import { fetchAllProficiencies } from '../../../../services/model/proficiencyPackService';
import { getCachedProficiencyList, setCachedProficiencyList } from './listCache';
import { buildProficiencyListComponents } from './listComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;

    let items = getCachedProficiencyList(guildId);

    if (!items) {
        const result = await fetchAllProficiencies(guildId);
        if (!result.success) {
            await interaction.editReply({
                flags:      MessageFlags.IsComponentsV2,
                components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }],
            } as never);
            return;
        }
        items = result.value!;
        setCachedProficiencyList(guildId, items);
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildProficiencyListComponents(items, 0) as never,
    });
}
