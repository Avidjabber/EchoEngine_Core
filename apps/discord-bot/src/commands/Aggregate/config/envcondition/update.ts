import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyLoading } from '../../../../core/reply';
import {
    fetchEnvConditionInfoData,
    fetchEnvConditionTemplateData,
} from '../../../../services/model/envConditionPackService';
import { getCachedEnvConditionInfo, setCachedEnvConditionInfo } from './infoState';
import { setUpdateState } from './updateState';
import { buildUpdatePickerComponents, buildUpdateTypeSelector } from './updateComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{
                type:         17,
                accent_color: colors.error,
                components:   [{ type: 10, content: 'You do not have permission to use this command.' }],
            }],
        } as never);
        return;
    }

    const guildId  = interaction.guildId!;
    const userId   = interaction.user.id;
    const codeName = interaction.options.getString('condition');

    // ── No condition provided: show picker ────────────────────────────────────

    if (!codeName) {
        let infoData = getCachedEnvConditionInfo(guildId);

        if (!infoData) {
            const result = await fetchEnvConditionInfoData(guildId);

            if (!result.success) {
                await interaction.editReply({
                    flags:      MessageFlags.IsComponentsV2,
                    components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }],
                } as never);
                return;
            }

            infoData = result.value!;
            setCachedEnvConditionInfo(guildId, infoData);
        }

        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: buildUpdatePickerComponents(infoData, 0) as never,
        });
        return;
    }

    // ── Condition provided: validate, fetch template, show type selector ───────

    const [infoResult, templateResult] = await Promise.all([
        (async () => {
            const cached = getCachedEnvConditionInfo(guildId);
            if (cached) return { success: true as const, value: cached };
            return fetchEnvConditionInfoData(guildId);
        })(),
        fetchEnvConditionTemplateData(guildId),
    ]);

    if (!infoResult.success || !templateResult.success) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: messages.errorGeneric }] }],
        } as never);
        return;
    }

    const infoData     = infoResult.value!;
    const templateData = templateResult.value!;

    if (!getCachedEnvConditionInfo(guildId)) {
        setCachedEnvConditionInfo(guildId, infoData);
    }

    const condition = infoData.conditions.find(c => c.codeName === codeName);

    if (!condition) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{
                type:         17,
                accent_color: colors.error,
                components:   [{ type: 10, content: `\`${codeName}\` is not a recognised env condition codeName.` }],
            }],
        } as never);
        return;
    }

    const state = {
        guildId,
        codeName:        condition.codeName,
        conditionName:   condition.name,
        modifierType:    null,
        effectType:      null,
        relation:        null,
        value:           null,
        stat:            null,
        proficiency:     null,
        hasDisadvantage: false,
        hasAdvantage:    false,
        hasExisting:     false,
        activeField:     null,
        effectTypes:     templateData.effectTypes,
        relations:       templateData.relations,
        stats:           templateData.stats,
        proficiencyDefs: templateData.proficiencyDefs,
        pickerPage:      -1,
    };

    setUpdateState(userId, guildId, state);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildUpdateTypeSelector(state) as never,
    });
}
