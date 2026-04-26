import type { EnvConditionInfoData } from '../../../../services/model/envConditionPackService';

interface InfoCache {
    data:      EnvConditionInfoData;
    expiresAt: number;
}

const cache  = new Map<string, InfoCache>();
const TTL_MS = 20 * 60 * 1000;

export function getCachedEnvConditionInfo(guildId: string): EnvConditionInfoData | null {
    const entry = cache.get(guildId);
    if (!entry || Date.now() > entry.expiresAt) {
        cache.delete(guildId);
        return null;
    }
    return entry.data;
}

export function setCachedEnvConditionInfo(guildId: string, data: EnvConditionInfoData): void {
    cache.set(guildId, { data, expiresAt: Date.now() + TTL_MS });
}

export function invalidateEnvConditionInfoCache(guildId: string): void {
    cache.delete(guildId);
}
