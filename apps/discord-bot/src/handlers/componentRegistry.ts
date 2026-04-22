import { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import { handleDenListDone, handleDenListConfig, handleDenListPage, handleDenToggle, handleDenDone, handleDenDelete } from '../commands/Aggregate/server/den/configHandlers';
import { handleGsFieldButton, handleGsFieldModal, handleGsFarmButton, handleGsFarmModal, handleGsFlagToggle, handleGsSection, handleGsCancel, handleGsFinalize } from '../commands/Aggregate/server/settings/settingsHandlers';

type AnyComponentInteraction =
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ModalSubmitInteraction;

export interface ComponentHandler {
    prefix: string;
    handler: (interaction: AnyComponentInteraction) => Promise<void> | void;
}

// ── Modal handlers ─────────────────────────────────────────────────────────────
export const modalHandlers: ComponentHandler[] = [
    { prefix: 'gs_field_modal:', handler: interaction => handleGsFieldModal(interaction as ModalSubmitInteraction) },
    { prefix: 'gs_farm_modal:', handler: interaction => handleGsFarmModal(interaction as ModalSubmitInteraction) },
];

// ── Select menu handlers ───────────────────────────────────────────────────────
export const selectMenuHandlers: ComponentHandler[] = [];

// ── Button handlers ────────────────────────────────────────────────────────────
export const buttonHandlers: ComponentHandler[] = [
    { prefix: 'den_list_done',    handler: interaction => handleDenListDone(interaction as ButtonInteraction) },
    { prefix: 'den_list_config:', handler: interaction => handleDenListConfig(interaction as ButtonInteraction) },
    { prefix: 'den_list_page:',   handler: interaction => handleDenListPage(interaction as ButtonInteraction) },
    { prefix: 'den_toggle:',      handler: interaction => handleDenToggle(interaction as ButtonInteraction) },
    { prefix: 'den_done:',        handler: interaction => handleDenDone(interaction as ButtonInteraction) },
    { prefix: 'den_delete:',      handler: interaction => handleDenDelete(interaction as ButtonInteraction) },
    { prefix: 'gs_field_btn:',    handler: interaction => handleGsFieldButton(interaction as ButtonInteraction) },
    { prefix: 'gs_farm_btn:',     handler: interaction => handleGsFarmButton(interaction as ButtonInteraction) },
    { prefix: 'gs_flag_toggle:',  handler: interaction => handleGsFlagToggle(interaction as ButtonInteraction) },
    { prefix: 'gs_section:',      handler: interaction => handleGsSection(interaction as ButtonInteraction) },
    { prefix: 'gs_cancel',        handler: interaction => handleGsCancel(interaction as ButtonInteraction) },
    { prefix: 'gs_finalize',      handler: interaction => handleGsFinalize(interaction as ButtonInteraction) },
];
