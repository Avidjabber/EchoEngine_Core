import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyLoading } from '../../../../core/reply';
import { fetchEnvConditionInfoData } from '../../../../services/model/envConditionPackService';
import { getCachedEnvConditionInfo, setCachedEnvConditionInfo } from './infoState';
import { buildEnvConditionInfoListComponents } from './infoComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction, false);

    const guildId = interaction.guildId!;

    let data = getCachedEnvConditionInfo(guildId);

    if (!data) {
        const result = await fetchEnvConditionInfoData(guildId);

        if (!result.success) {
            await interaction.editReply({
                flags:      MessageFlags.IsComponentsV2,
                components: [{
                    type:         17,
                    accent_color: colors.error,
                    components:   [{ type: 10, content: messages.errorGeneric }],
                }],
            } as never);
            return;
        }

        data = result.value!;
        setCachedEnvConditionInfo(guildId, data);
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionInfoListComponents(data, 0) as never,
    });
}
