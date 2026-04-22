import {
    ButtonInteraction,
    ContainerBuilder,
    MessageFlags,
    TextDisplayBuilder,
} from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { getCachedInfo } from './infoState';
import { buildInfoMainComponents, buildInfoFarmingComponents, buildInfoFlagsComponents } from './infoComponents';

// customId format: gsi_section:<section>

export async function handleGsiSection(interaction: ButtonInteraction): Promise<void> {
    const section   = interaction.customId.split(':')[1];
    const guildId   = interaction.guildId!;
    const guildName = interaction.guild!.name;

    const state = getCachedInfo(guildId);

    if (!state) {
        await interaction.reply({
            flags:      MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messages.errorGeneric),
                    ),
            ],
        });
        return;
    }

    await interaction.deferUpdate();

    let components: object[];

    if (section === 'farming') {
        components = buildInfoFarmingComponents(state, guildName);
    } else if (section === 'flags') {
        components = buildInfoFlagsComponents(state, guildName);
    } else {
        components = buildInfoMainComponents(state, guildName);
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: components as never,
    });
}

// customId: gsi_done

export async function handleGsiDone(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    await interaction.deleteReply();
}
