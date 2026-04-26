import type { CombatTargetEntity } from '../../../../../services/play/combatService';

// Keyed by `{setupId}:{teamIndex}:{type}` where type is 'invite' or 'signup'
const cache = new Map<string, CombatTargetEntity[]>();

function key(setupId: string, teamIndex: number, type: 'invite' | 'signup'): string {
    return `${setupId}:${teamIndex}:${type}`;
}

export function setCachedPickerEntities(
    setupId:   string,
    teamIndex: number,
    type:      'invite' | 'signup',
    entities:  CombatTargetEntity[],
): void {
    cache.set(key(setupId, teamIndex, type), entities);
}

export function getCachedPickerEntities(
    setupId:   string,
    teamIndex: number,
    type:      'invite' | 'signup',
): CombatTargetEntity[] | undefined {
    return cache.get(key(setupId, teamIndex, type));
}

export function invalidatePickerCache(setupId: string): void {
    for (const k of cache.keys()) {
        if (k.startsWith(`${setupId}:`)) cache.delete(k);
    }
}
