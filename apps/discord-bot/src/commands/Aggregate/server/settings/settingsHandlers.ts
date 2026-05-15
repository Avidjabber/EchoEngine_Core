import {
    ActionRowBuilder,
    ButtonInteraction,
    ContainerBuilder,
    GuildTextBasedChannel,
    MessageFlags,
    ModalBuilder,
    ModalSubmitInteraction,
    StringSelectMenuInteraction,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import { replyError } from '../../../../core/reply';
import { updateGuildSettings, SettingsNumberKey } from '../../../../services/server/settingsService';
import { getState, setState, clearState } from './settingsState';
import { setCachedInfo } from './infoState';
import { buildGuildSettingsComponents, SETTINGS_NUMBER_FIELDS } from './updateComponents';
import { buildFarmingSettingsComponents, FARMING_FIELDS, FarmingFieldKey } from './farmingComponents';
import { buildFlagsSettingsComponents, FLAG_FIELDS, FlagKey } from './flagsComponents';

// ── Button: open update modal ────────────────────────────────────────────────
// customId format: gs_field_btn:<fieldKey>

export async function handleGsFieldButton(interaction: ButtonInteraction): Promise<void> {
    const fieldKey = interaction.customId.split(':')[1] as SettingsNumberKey;
    const guildId  = interaction.guildId!;

    const fieldDef = SETTINGS_NUMBER_FIELDS.find(f => f.key === fieldKey);
    if (!fieldDef) return;

    const state = getState(interaction.user.id, guildId);

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

    const currentValue = state[fieldKey];
    const prePopulated = currentValue === null ? '' : String(currentValue);
    const inputLabel   = fieldDef.nullable
        ? 'Value (0–9999, leave empty to clear)'
        : 'Value (0–9999)';

    const modal = new ModalBuilder()
        .setCustomId(`gs_field_modal:${fieldKey}`)
        .setTitle(`Update ${fieldDef.label}`)
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('value')
                    .setLabel(inputLabel)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(4)
                    .setRequired(!fieldDef.nullable)
                    .setValue(prePopulated),
            ),
        );

    await interaction.showModal(modal);
}

// ── Modal submit: update state only, re-render ────────────────────────────────
// customId format: gs_field_modal:<fieldKey>

export async function handleGsFieldModal(interaction: ModalSubmitInteraction): Promise<void> {
    const fieldKey = interaction.customId.split(':')[1] as SettingsNumberKey;
    const guildId  = interaction.guildId!;
    const rawInput = interaction.fields.getTextInputValue('value').trim();

    const fieldDef = SETTINGS_NUMBER_FIELDS.find(f => f.key === fieldKey);
    if (!fieldDef) return;

    const state = getState(interaction.user.id, guildId);

    if (!state) {
        await replyError(interaction as never, messages.notYourButton);
        return;
    }

    // Validate
    let value: number | null = null;

    if (rawInput === '') {
        if (!fieldDef.nullable) {
            await replyError(interaction as never, `*"That field can't be left empty!"*`);
            return;
        }
    } else {
        const parsed = parseInt(rawInput, 10);
        if (isNaN(parsed) || parsed < 0 || parsed > 9999 || String(parsed) !== rawInput) {
            await replyError(interaction as never, `*"That doesn't look right — please enter a whole number between 0 and 9999."*`);
            return;
        }
        value = parsed;
    }

    const updated = { ...state, [fieldKey]: value };
    setState(interaction.user.id, guildId, updated);

    await interaction.deferUpdate();

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildGuildSettingsComponents(updated, interaction.guild!.name) as never,
    });
}

// ── Farming button: open update modal ────────────────────────────────────────
// customId format: gs_farm_btn:<fieldKey>

export async function handleGsFarmButton(interaction: ButtonInteraction): Promise<void> {
    const fieldKey  = interaction.customId.split(':')[1] as FarmingFieldKey;
    const guildId   = interaction.guildId!;

    const fieldDef = FARMING_FIELDS.find(f => f.key === fieldKey);
    if (!fieldDef) return;

    const state = getState(interaction.user.id, guildId);

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

    const modal = new ModalBuilder()
        .setCustomId(`gs_farm_modal:${fieldKey}`)
        .setTitle(`Update ${fieldDef.label}`)
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('value')
                    .setLabel('Value (0–1, e.g. 0.05)')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(4)
                    .setRequired(true)
                    .setValue(String(state[fieldKey])),
            ),
        );

    await interaction.showModal(modal);
}

// ── Farming modal submit: update state only, re-render ────────────────────────
// customId format: gs_farm_modal:<fieldKey>

export async function handleGsFarmModal(interaction: ModalSubmitInteraction): Promise<void> {
    const fieldKey = interaction.customId.split(':')[1] as FarmingFieldKey;
    const guildId  = interaction.guildId!;
    const rawInput = interaction.fields.getTextInputValue('value').trim();

    const state = getState(interaction.user.id, guildId);

    if (!state) {
        await replyError(interaction as never, messages.notYourButton);
        return;
    }

    const parsed = parseFloat(rawInput);

    if (isNaN(parsed) || parsed < 0 || parsed > 1) {
        await replyError(interaction as never, `*"That doesn't look right — please enter a number between 0 and 1, such as 0.05."*`);
        return;
    }

    const updated = { ...state, [fieldKey]: parsed };
    setState(interaction.user.id, guildId, updated);

    await interaction.deferUpdate();

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildFarmingSettingsComponents(updated, interaction.guild!.name) as never,
    });
}

// ── Flag toggle ───────────────────────────────────────────────────────────────
// customId format: gs_flag_toggle:<flagKey>

export async function handleGsFlagToggle(interaction: ButtonInteraction): Promise<void> {
    const flagKey = interaction.customId.split(':')[1] as FlagKey;
    const guildId = interaction.guildId!;

    if (!FLAG_FIELDS.find(f => f.key === flagKey)) return;

    const state = getState(interaction.user.id, guildId);

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

    const updated = { ...state, [flagKey]: !state[flagKey] };
    setState(interaction.user.id, guildId, updated);

    await interaction.update({
        flags:      MessageFlags.IsComponentsV2,
        components: buildFlagsSettingsComponents(updated, interaction.guild!.name) as never,
    });
}

// ── Timezone button: show picker ──────────────────────────────────────────────
// customId: gs_tz_btn

export async function handleGsTzButton(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const state   = getState(interaction.user.id, guildId);

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

    await interaction.update({
        flags:      MessageFlags.IsComponentsV2,
        components: buildGuildSettingsComponents(state, interaction.guild!.name, true) as never,
    });
}

// ── Timezone select: save and return to main view ─────────────────────────────
// customId: gs_tz_select

export async function handleGsTzSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const state   = getState(interaction.user.id, guildId);

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

    const offset  = parseInt(interaction.values[0], 10);
    const updated = { ...state, timezoneOffset: offset };
    setState(interaction.user.id, guildId, updated);

    await interaction.update({
        flags:      MessageFlags.IsComponentsV2,
        components: buildGuildSettingsComponents(updated, interaction.guild!.name) as never,
    });
}

// ── Section navigation ────────────────────────────────────────────────────────
// customId format: gs_section:<section>

export async function handleGsSection(interaction: ButtonInteraction): Promise<void> {
    const section  = interaction.customId.split(':')[1];
    const guildId  = interaction.guildId!;
    const guildName = interaction.guild!.name;

    const state = getState(interaction.user.id, guildId);

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

    let components: object[];

    if (section === 'farming') {
        components = buildFarmingSettingsComponents(state, guildName);
    } else if (section === 'flags') {
        components = buildFlagsSettingsComponents(state, guildName);
    } else {
        components = buildGuildSettingsComponents(state, guildName);
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: components as never,
    });
}

// ── Cancel ───────────────────────────────────────────────────────────────────
// customId: gs_cancel

export async function handleGsCancel(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;

    if (!getState(interaction.user.id, guildId)) {
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

    clearState(interaction.user.id, guildId);
    await interaction.deferUpdate();
    await interaction.deleteReply();
}

// ── Finalize ─────────────────────────────────────────────────────────────────
// customId: gs_finalize

export async function handleGsFinalize(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const state   = getState(interaction.user.id, guildId);

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

    const { guildId: _id, ...fields } = state;
    const result = await updateGuildSettings(guildId, fields);

    clearState(interaction.user.id, guildId);

    if (!result.success) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(colors.error)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(messages.errorGeneric),
                    ),
            ] as never,
        });
        return;
    }

    setCachedInfo(guildId, state);

    const announcement = new ContainerBuilder()
        .setAccentColor(colors.success)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                messages.guildSettingsSaved(interaction.user.id),
            ),
        );

    await (interaction.channel as GuildTextBasedChannel | null)?.send({
        flags:      MessageFlags.IsComponentsV2,
        components: [announcement],
    });

    await interaction.deleteReply();
}
