// Centralised string constants for all bot messages.
// Keep user-facing text here so it's easy to find and update.

export const messages = {
    // ── Guild join ───────────────────────────────────────────────────────────
    guildWelcome: 'Hello! I\'m EchoEngine. Use `/den set` to register a channel for bot commands.',

    // ── Den validation ───────────────────────────────────────────────────────
    denNotSet:
        'No dens have been configured yet. An admin must run `/den set` to register a channel first.',
    denRestricted:
        'This command can only be used in a registered den channel.',

    // ── Interaction lifecycle ────────────────────────────────────────────────
    deferMessage: 'Working on it...',

    // ── Generic errors ───────────────────────────────────────────────────────
    errorGeneric: 'Something went wrong. Please try again.',
} as const;

export type MessageKey = keyof typeof messages;
