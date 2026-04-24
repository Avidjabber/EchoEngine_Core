import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyLoading } from '../../../../core/reply';
import { fetchProficiencyByCodeName, fetchProficiencyTemplateData } from '../../../../services/model/proficiencyPackService';
import { setUpdateState } from './updateState';
import { buildUpdatePreviewCard } from './updateComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: 0xe74c3c, components: [{ type: 10, content: messages.invalidPerms }] }],
        } as never);
        return;
    }

    const guildId  = interaction.guildId!;
    const userId   = interaction.user.id;
    const codeName = interaction.options.getString('codename', true);

    const [defResult, templateResult] = await Promise.all([
        fetchProficiencyByCodeName(guildId, codeName),
        fetchProficiencyTemplateData(guildId),
    ]);

    if (!templateResult.success) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: 0xe74c3c, components: [{ type: 10, content: messages.errorGeneric }] }],
        } as never);
        return;
    }

    if (!defResult.success) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: 0xe74c3c, components: [{ type: 10, content: `\`${codeName}\` is not a recognised proficiency codeName.` }] }],
        } as never);
        return;
    }

    const def  = defResult.value!;
    const state = {
        guildId,
        originalCodeName: def.codeName,
        name:             def.name,
        codeName:         def.codeName,
        stat:             def.stat,
        description:      def.description ?? '',
        statOptions:      templateResult.value!.stats,
    };

    setUpdateState(userId, guildId, state);

    await interaction.editReply(buildUpdatePreviewCard(state, userId) as never);
}
