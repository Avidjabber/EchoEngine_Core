import {
    ButtonInteraction,
    ContainerBuilder,
    MessageFlags,
    TextDisplayBuilder,
} from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { removeDen, updateDen } from '../../../../services/server/denService';
import { getState, clearState, setState, DenConfigKey } from './configState';
import { buildDenConfigComponents } from './configComponents';

// ── Toggle ──────────────────────────────────────────────────────────────────
// customId format: den_toggle:<fieldKey>:<channelId>

export async function handleDenToggle(interaction: ButtonInteraction): Promise<void> {
    const parts = interaction.customId.split(':');
    const fieldKey  = parts[1] as DenConfigKey;
    const channelId = parts[2];

    const state = getState(interaction.user.id, channelId);

    if (!state) {
        await interaction.reply({
            flags:      MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messages.notYourButton),
                    ),
            ],
        });
        return;
    }

    const updated = { ...state, [fieldKey]: !state[fieldKey] };
    setState(interaction.user.id, channelId, updated);

    const channel = interaction.guild?.channels.cache.get(channelId);
    const channelName = channel && 'name' in channel ? (channel.name as string) : channelId;

    await interaction.update({
        flags:      MessageFlags.IsComponentsV2,
        components: buildDenConfigComponents(updated, channelName) as never,
    });
}

// ── Done ────────────────────────────────────────────────────────────────────
// customId format: den_done:<channelId>

export async function handleDenDone(interaction: ButtonInteraction): Promise<void> {
    const channelId = interaction.customId.split(':')[1];
    const state     = getState(interaction.user.id, channelId);

    if (!state) {
        await interaction.reply({
            flags:      MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messages.notYourButton),
                    ),
            ],
        });
        return;
    }

    await interaction.deferUpdate();

    const result = await updateDen(state);

    if (!result.success) {
        clearState(interaction.user.id, channelId);
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messages.apiError(result.error!)),
                    ),
            ] as never,
        });
        return;
    }

    clearState(interaction.user.id, channelId);

    const savedContainer = new ContainerBuilder()
        .setAccentColor(colors.success)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                messages.denConfigSaved(interaction.user.id, channelId),
            ),
        );

    await interaction.channel?.send({
        flags:      MessageFlags.IsComponentsV2,
        components: [savedContainer],
    });

    await interaction.deleteReply();
}

// ── Delete ───────────────────────────────────────────────────────────────────
// customId format: den_delete:<channelId>

export async function handleDenDelete(interaction: ButtonInteraction): Promise<void> {
    const channelId = interaction.customId.split(':')[1];
    const state     = getState(interaction.user.id, channelId);

    if (!state) {
        await interaction.reply({
            flags:      MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messages.notYourButton),
                    ),
            ],
        });
        return;
    }

    await interaction.deferUpdate();

    const result = await removeDen(state.guildId, channelId);

    if (!result.success) {
        clearState(interaction.user.id, channelId);
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messages.apiError(result.error!)),
                    ),
            ] as never,
        });
        return;
    }

    clearState(interaction.user.id, channelId);

    const deletedContainer = new ContainerBuilder()
        .setAccentColor(colors.info)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                messages.denConfigDeleted(interaction.user.id, channelId),
            ),
        );

    await interaction.channel?.send({
        flags:      MessageFlags.IsComponentsV2,
        components: [deletedContainer],
    });

    await interaction.deleteReply();
}
