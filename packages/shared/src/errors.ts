// Shared error codes used by the API and referenced by the bot.
// The API throws these as the `code` field; the bot checks against them.

export const errorCodes = {
    // ── Dens ──────────────────────────────────────────────────────────────────
    DEN_ALREADY_EXISTS:  'DEN_ALREADY_EXISTS',   // channel is already a registered den
    DEN_NOT_FOUND:       'DEN_NOT_FOUND',         // den does not exist (remove/lookup)
    DEN_NO_PERMISSION:   'DEN_NO_PERMISSION',     // bot lacks permission to post in channel
    NO_DENS_FOUND:       'NO_DENS_FOUND',         // guild has no dens registered (list)

    // ── Guild Settings ────────────────────────────────────────────────────────
    GUILD_SETTINGS_NOT_FOUND: 'GUILD_SETTINGS_NOT_FOUND', // guild has no settings row yet

} as const;

export type ErrorCode = typeof errorCodes[keyof typeof errorCodes];
