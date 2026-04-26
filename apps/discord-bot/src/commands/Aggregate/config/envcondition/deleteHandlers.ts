import { ButtonInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { fetchEnvConditionInfoData, resetEnvConditionForCondition } from '../../../../services/model/envConditionPackService';
import { getCachedEnvConditionInfo, setCachedEnvConditionInfo, invalidateEnvConditionInfoCache } from './infoState';
import { buildEnvConditionDeletePickerComponents, buildEnvConditionDeleteConfirmComponents } from './deleteComponents';
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

function isAdmin(interaction: ButtonInteraction): boolean {
    return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
}

// customId: ec_del_page:{page}
export async function handleEcDelPage(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    const page = parseInt(interaction.customId.split(':')[1], 10);
    await interaction.deferUpdate();

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionDeletePickerComponents(data, page) as never,
    });
}

// customId: ec_del_pick:{listPage}:{codeName}
export async function handleEcDelPick(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    const parts    = interaction.customId.split(':');
    const listPage = parseInt(parts[1], 10);
    const codeName = parts.slice(2).join(':');

    await interaction.deferUpdate();

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionDeleteConfirmComponents(data, codeName, listPage) as never,
    });
}

// customId: ec_del_confirm:{listPage}:{codeName}
export async function handleEcDelConfirm(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    const parts    = interaction.customId.split(':');
    const listPage = parseInt(parts[1], 10);
    const codeName = parts.slice(2).join(':');
    const guildId  = interaction.guildId!;
    const userId   = interaction.user.id;

    await interaction.deferUpdate();

    const result = await resetEnvConditionForCondition(guildId, codeName);

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

    invalidateEnvConditionInfoCache(guildId);

    const { worldModifiers, statModifiers, proficiencyModifiers } = result.value!;
    const total = worldModifiers + statModifiers + proficiencyModifiers;

    const data = await resolveData(interaction);
    const conditionName = data?.conditions.find(c => c.codeName === codeName)?.name ?? codeName;

    const publicContent = total === 0
        ? [
            `## ${conditionName} Modifiers Deleted`,
            `Deleted by <@${userId}>`,
            '',
            '-# No modifiers were configured — nothing was cleared.',
          ].join('\n')
        : [
            `## ${conditionName} Modifiers Deleted`,
            `Deleted by <@${userId}>`,
            '',
            `-# ${worldModifiers} world modifier${worldModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${statModifiers} stat modifier${statModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${proficiencyModifiers} proficiency modifier${proficiencyModifiers !== 1 ? 's' : ''} deleted`,
          ].join('\n');

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: total === 0 ? colors.info : colors.success,
            components:   [{ type: 10, content: publicContent }],
        }],
    } as never);

    await interaction.deleteReply();
}

// customId: ec_del_back:{listPage}  — listPage = -1 means cancel (no picker to return to)
export async function handleEcDelBack(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    const listPage = parseInt(interaction.customId.split(':')[1], 10);
    await interaction.deferUpdate();

    if (listPage < 0) {
        await interaction.deleteReply();
        return;
    }

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionDeletePickerComponents(data, listPage) as never,
    });
}
