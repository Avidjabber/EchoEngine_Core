import type { Den } from './denService';

// Write-through cache — TTL is a safety net only; all writes update the cache immediately.
const TTL_MS = 2 * 60 * 60 * 1000;

interface CacheEntry {
    dens:      Den[];
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getEntry(guildId: string): CacheEntry | null {
    const entry = cache.get(guildId);
    if (!entry || Date.now() > entry.expiresAt) {
        cache.delete(guildId);
        return null;
    }
    return entry;
}

export function getCachedDens(guildId: string): Den[] | null {
    return getEntry(guildId)?.dens ?? null;
}

export function setCachedDens(guildId: string, dens: Den[]): void {
    cache.set(guildId, { dens, expiresAt: Date.now() + TTL_MS });
}

export function addCachedDen(guildId: string, den: Den): void {
    const entry = getEntry(guildId);
    if (!entry) return;
    entry.dens = [...entry.dens, den];
    entry.expiresAt = Date.now() + TTL_MS;
}

export function updateCachedDen(guildId: string, den: Den): void {
    const entry = getEntry(guildId);
    if (!entry) return;
    entry.dens = entry.dens.map(d => d.channelId === den.channelId ? den : d);
    entry.expiresAt = Date.now() + TTL_MS;
}

export function removeCachedDen(guildId: string, channelId: string): void {
    const entry = getEntry(guildId);
    if (!entry) return;
    entry.dens = entry.dens.filter(d => d.channelId !== channelId);
    entry.expiresAt = Date.now() + TTL_MS;
}
