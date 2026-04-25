import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError, replyLoading } from '../../../../core/reply';
import { fetchEnvConditionModifiers } from '../../../../services/model/envConditionPackService';
import { getCachedEnvConditionModifiers, setCachedEnvConditionModifiers } from './listCache';
import { buildEnvConditionListComponents } from './listComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await replyLoading(interaction);

    const guildId = interaction.guildId!;
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

    let data = getCachedEnvConditionModifiers(guildId);

    if (!data) {
        const result = await fetchEnvConditionModifiers(guildId);
        if (!result.success) {
            await replyError(interaction, messages.errorGeneric);
            return;
        }
        data = result.value!;
        setCachedEnvConditionModifiers(guildId, data);
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildEnvConditionListComponents(data, 0, 'all', isAdmin) as never,
    });
}
