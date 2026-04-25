import type { ProficiencyListItem } from '../../../../services/model/proficiencyPackService';

const CACHE_TTL = 20 * 60 * 1000;

interface CacheEntry {
    data:      ProficiencyListItem[];
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedProficiencyList(guildId: string): ProficiencyListItem[] | undefined {
    const entry = cache.get(guildId);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
        cache.delete(guildId);
        return undefined;
    }
    return entry.data;
}

export function setCachedProficiencyList(guildId: string, data: ProficiencyListItem[]): void {
    cache.set(guildId, { data, expiresAt: Date.now() + CACHE_TTL });
}

export function invalidateProficiencyListCache(guildId: string): void {
    cache.delete(guildId);
}
