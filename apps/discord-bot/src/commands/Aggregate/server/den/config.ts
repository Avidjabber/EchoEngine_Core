import {
    ChatInputCommandInteraction,
    GuildChannel,
    MessageFlags,
} from 'discord.js';
import { messages } from '@echoengine/shared';
import { replyError } from '../../../../core/reply';
import { getDen } from '../../../../services/server/denService';
import { getCachedDens } from '../../../../services/server/denCache';
import { setState } from './configState';
import { buildDenConfigComponents } from './configComponents';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const channel = interaction.options.getChannel('channel', true) as GuildChannel;
    const channelId = channel.id;

    let den = getCachedDens(guildId)?.find(d => d.channelId === channelId) ?? null;

    if (!den) {
        const result = await getDen(guildId, channelId);
        if (!result.success) {
            await replyError(interaction, messages.denNotFound);
            return;
        }
        den = result.value!;
    }

    setState(interaction.user.id, channelId, {
        guildId,
        channelId,
        allowWorldSim:    den.allowWorldSim,
        allowConditions:  den.allowConditions,
        allowCombat:      den.allowCombat,
        allowActivities:  den.allowActivities,
        allowEvents:      den.allowEvents,
        allowCrafting:    den.allowCrafting,
        allowProgression: den.allowProgression,
        allowSocial:      den.allowSocial,
    });

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildDenConfigComponents(
            {
                guildId,
                channelId,
                allowWorldSim:    den.allowWorldSim,
                allowConditions:  den.allowConditions,
                allowCombat:      den.allowCombat,
                allowActivities:  den.allowActivities,
                allowEvents:      den.allowEvents,
                allowCrafting:    den.allowCrafting,
                allowProgression: den.allowProgression,
                allowSocial:      den.allowSocial,
            },
            channel.name,
        ) as never,
    });
}
