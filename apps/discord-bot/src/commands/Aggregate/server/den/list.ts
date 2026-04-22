import {
    ChatInputCommandInteraction,
    MessageFlags,
} from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError } from '../../../../core/reply';
import { getDens } from '../../../../services/server/denService';
import { buildDenListComponents } from './listComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const result = await getDens(interaction.guildId!);

    if (!result.success) {
        await replyError(interaction, messages.apiError(result.error!));
        return;
    }

    const dens = result.value ?? [];

    if (!dens.length) {
        await replyError(interaction, messages.noDens);
        return;
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildDenListComponents(dens, 0) as never,
    });
}
