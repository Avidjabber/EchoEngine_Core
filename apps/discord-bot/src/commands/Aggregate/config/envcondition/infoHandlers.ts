import { ButtonInteraction, MessageFlags } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { fetchEnvConditionInfoData } from '../../../../services/model/envConditionPackService';
import { getCachedEnvConditionInfo, setCachedEnvConditionInfo, invalidateEnvConditionInfoCache } from './infoState';
import { buildEnvConditionInfoListComponents, buildEnvConditionInfoDetailComponents } from './infoComponents';
import type { EnvConditionInfoData } from '../../../../services/model/envConditionPackService';

async function resolveData(interaction: ButtonInteraction): Promise<EnvConditionInfoData | null> {
    const guildId = interaction.guildId!;
    const cached  = getCachedEnvConditionInfo(guildId);
    if (cached) return cached;

    const result = await fetchEnvConditionInfoData(guildId);
    if (!result.success) return null;

    setCachedEnvConditionInfo(guildId, result.value!);
    return result.value!;
}

async function replyFetchError(interaction: ButtonInteraction): Promise<void> {
    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.error,
            components:   [{ type: 10, content: messages.errorGeneric }],
        }],
    } as never);
}

// customId: ec_info_d:{listPage}:{codeName}
export async function handleEcInfoDetail(interaction: ButtonInteraction): Promise<void> {
    const parts    = interaction.customId.split(':');
    const listPage = parseInt(parts[1], 10);
    const codeName = parts.slice(2).join(':');

    await interaction.deferUpdate();

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionInfoDetailComponents(data, codeName, listPage) as never,
    });
}

// customId: ec_info_back:{listPage}
export async function handleEcInfoBack(interaction: ButtonInteraction): Promise<void> {
    const listPage = parseInt(interaction.customId.split(':')[1], 10);

    await interaction.deferUpdate();

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionInfoListComponents(data, listPage) as never,
    });
}

// customId: ec_info_page:{page}
export async function handleEcInfoPage(interaction: ButtonInteraction): Promise<void> {
    const page = parseInt(interaction.customId.split(':')[1], 10);

    await interaction.deferUpdate();

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionInfoListComponents(data, page) as never,
    });
}

// customId: ec_info_done
export async function handleEcInfoDone(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    invalidateEnvConditionInfoCache(interaction.guildId!);
    await interaction.deleteReply();
}
