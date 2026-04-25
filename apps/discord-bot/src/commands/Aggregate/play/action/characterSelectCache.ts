import type { PlayCharacter } from '../../../../services/play/entityService';

const cache = new Map<string, PlayCharacter[]>();

function key(guildId: string, userId: string): string {
    return `${guildId}:${userId}`;
}

export function setCachedCharacters(guildId: string, userId: string, chars: PlayCharacter[]): void {
    cache.set(key(guildId, userId), chars);
}

export function getCachedCharacters(guildId: string, userId: string): PlayCharacter[] | undefined {
    return cache.get(key(guildId, userId));
}

export function invalidateCharacterCache(guildId: string, userId: string): void {
    cache.delete(key(guildId, userId));
}
