import { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import { handleDenListDone, handleDenListConfig, handleDenListPage, handleDenToggle, handleDenDone, handleDenDelete } from '../commands/Aggregate/server/den/configHandlers';

type AnyComponentInteraction =
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ModalSubmitInteraction;

export interface ComponentHandler {
    prefix: string;
    handler: (interaction: AnyComponentInteraction) => Promise<void> | void;
}

// ── Modal handlers ─────────────────────────────────────────────────────────────
export const modalHandlers: ComponentHandler[] = [];

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
];
