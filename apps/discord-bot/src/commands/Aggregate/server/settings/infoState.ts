import { GuildSettingsState } from './settingsState';

interface InfoCache {
    state:     GuildSettingsState;
    expiresAt: number;
}

const cache = new Map<string, InfoCache>();
const TTL_MS = 30 * 60 * 1000;

export function getCachedInfo(guildId: string): GuildSettingsState | null {
    const entry = cache.get(guildId);
    if (!entry || Date.now() > entry.expiresAt) {
        cache.delete(guildId);
        return null;
    }
    return entry.state;
}

export function setCachedInfo(guildId: string, state: GuildSettingsState): void {
    cache.set(guildId, { state, expiresAt: Date.now() + TTL_MS });
}

export function invalidateInfoCache(guildId: string): void {
    cache.delete(guildId);
}
