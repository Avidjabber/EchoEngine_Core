import type { EnvConditionModifiersData } from '../../../../services/model/envConditionPackService';

const CACHE_TTL = 20 * 60 * 1000;

interface CacheEntry {
    data:      EnvConditionModifiersData;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedEnvConditionModifiers(guildId: string): EnvConditionModifiersData | null {
    const entry = cache.get(guildId);
    if (!entry || Date.now() > entry.expiresAt) {
        cache.delete(guildId);
        return null;
    }
    return entry.data;
}

export function setCachedEnvConditionModifiers(guildId: string, data: EnvConditionModifiersData): void {
    cache.set(guildId, { data, expiresAt: Date.now() + CACHE_TTL });
}

export function invalidateEnvConditionModifiersCache(guildId: string): void {
    cache.delete(guildId);
}
