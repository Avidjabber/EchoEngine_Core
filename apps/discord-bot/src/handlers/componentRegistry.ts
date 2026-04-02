import { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';

type AnyComponentInteraction =
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ModalSubmitInteraction;

export interface ComponentHandler {
    prefix: string;
    handler: (interaction: AnyComponentInteraction) => Promise<void> | void;
}

// ── Modal handlers ─────────────────────────────────────────────────────────────
// import { handleSomeModal } from '../commands/Aggregate/Something/actions/someModalHandler';
//
// export const modalHandlers: ComponentHandler[] = [
//     { prefix: 'someModal', handler: handleSomeModal },
// ];

export const modalHandlers: ComponentHandler[] = [];

// ── Select menu handlers ───────────────────────────────────────────────────────
export const selectMenuHandlers: ComponentHandler[] = [];

// ── Button handlers ────────────────────────────────────────────────────────────
export const buttonHandlers: ComponentHandler[] = [];
