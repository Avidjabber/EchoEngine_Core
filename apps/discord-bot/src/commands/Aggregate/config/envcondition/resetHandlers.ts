import { ButtonInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { fetchEnvConditionInfoData, resetEnvConditionForCondition, resetEnvConditionPack } from '../../../../services/model/envConditionPackService';
import { getCachedEnvConditionInfo, setCachedEnvConditionInfo, invalidateEnvConditionInfoCache } from './infoState';
import { buildEnvConditionResetPickerComponents, buildEnvConditionResetConfirmComponents, buildEnvConditionResetAllComponents } from './resetComponents';
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

// customId: ec_rst_page:{page}
export async function handleEcRstPage(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    const page = parseInt(interaction.customId.split(':')[1], 10);
    await interaction.deferUpdate();

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionResetPickerComponents(data, page) as never,
    });
}

// customId: ec_rst_pick:{listPage}:{codeName}
export async function handleEcRstPick(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    const parts    = interaction.customId.split(':');
    const listPage = parseInt(parts[1], 10);
    const codeName = parts.slice(2).join(':');

    await interaction.deferUpdate();

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionResetConfirmComponents(data, codeName, listPage) as never,
    });
}

// customId: ec_rst_confirm:{listPage}:{codeName}
export async function handleEcRstConfirm(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    const parts    = interaction.customId.split(':');
    const listPage = parseInt(parts[1], 10);
    const codeName = parts.slice(2).join(':');
    const guildId  = interaction.guildId!;

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

    const summary = total === 0
        ? `No modifiers were configured for **${conditionName}** — nothing to clear.`
        : [
            `## ${conditionName} Modifiers Cleared`,
            `-# ${worldModifiers} world modifier${worldModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${statModifiers} stat modifier${statModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${proficiencyModifiers} proficiency modifier${proficiencyModifiers !== 1 ? 's' : ''} deleted`,
          ].join('\n');

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: total === 0 ? colors.info : colors.success,
            components:   [{ type: 10, content: summary }],
        }],
    } as never);

    if (total > 0) {
        const publicSummary = [
            `## ${conditionName} Cleared`,
            `Cleared by <@${interaction.user.id}>`,
            ``,
            `-# ${worldModifiers} world modifier${worldModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${statModifiers} stat modifier${statModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${proficiencyModifiers} proficiency modifier${proficiencyModifiers !== 1 ? 's' : ''} deleted`,
        ].join('\n');

        await interaction.followUp({
            flags:      MessageFlags.IsComponentsV2,
            components: [{
                type:         17,
                accent_color: colors.success,
                components:   [{ type: 10, content: publicSummary }],
            }],
        } as never);
    }
}

// customId: ec_rst_all_confirm
export async function handleEcRstAllConfirm(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    const guildId = interaction.guildId!;
    await interaction.deferUpdate();

    const result = await resetEnvConditionPack(guildId);

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

    const summary = total === 0
        ? 'No modifiers were configured in this guild — nothing to clear.'
        : [
            `## All Modifiers Cleared`,
            `-# ${worldModifiers} world modifier${worldModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${statModifiers} stat modifier${statModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${proficiencyModifiers} proficiency modifier${proficiencyModifiers !== 1 ? 's' : ''} deleted`,
          ].join('\n');

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: total === 0 ? colors.info : colors.success,
            components:   [{ type: 10, content: summary }],
        }],
    } as never);

    if (total > 0) {
        const publicSummary = [
            `## All Env Condition Modifiers Cleared`,
            `Cleared by <@${interaction.user.id}>`,
            ``,
            `-# ${worldModifiers} world modifier${worldModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${statModifiers} stat modifier${statModifiers !== 1 ? 's' : ''} deleted`,
            `-# ${proficiencyModifiers} proficiency modifier${proficiencyModifiers !== 1 ? 's' : ''} deleted`,
        ].join('\n');

        await interaction.followUp({
            flags:      MessageFlags.IsComponentsV2,
            components: [{
                type:         17,
                accent_color: colors.success,
                components:   [{ type: 10, content: publicSummary }],
            }],
        } as never);
    }
}

// customId: ec_rst_all_back
export async function handleEcRstAllBack(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    await interaction.deferUpdate();

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.info,
            components:   [{ type: 10, content: 'Reset cancelled. No changes were made.' }],
        }],
    } as never);
}

// customId: ec_rst_back:{listPage}  — listPage = -1 means cancel (no picker to return to)
export async function handleEcRstBack(interaction: ButtonInteraction): Promise<void> {
    if (!isAdmin(interaction)) return;

    const listPage = parseInt(interaction.customId.split(':')[1], 10);
    await interaction.deferUpdate();

    if (listPage < 0) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{
                type:         17,
                accent_color: colors.info,
                components:   [{ type: 10, content: 'Reset cancelled. No changes were made.' }],
            }],
        } as never);
        return;
    }

    const data = await resolveData(interaction);
    if (!data) { await replyFetchError(interaction); return; }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionResetPickerComponents(data, listPage) as never,
    });
}
