import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { fetchEnvConditionInfoData } from '../../../../services/model/envConditionPackService';
import { getCachedEnvConditionInfo, setCachedEnvConditionInfo } from './infoState';
import { buildEnvConditionResetPickerComponents, buildEnvConditionResetConfirmComponents, buildEnvConditionResetAllComponents } from './resetComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
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
    const codeName = interaction.options.getString('condition');
    const resetAll = interaction.options.getBoolean('all') ?? false;

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

    if (resetAll) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: buildEnvConditionResetAllComponents(data) as never,
        });
        return;
    }

    if (codeName) {
        const exists = data.conditions.some(c => c.codeName === codeName);

        if (!exists) {
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

        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: buildEnvConditionResetConfirmComponents(data, codeName, -1) as never,
        });
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionResetPickerComponents(data, 0) as never,
    });
}
