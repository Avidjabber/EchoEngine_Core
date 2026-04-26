import { apiClient } from '../api';

export interface PlayCharacter {
    id:          number;
    name:        string;
    age:         number;
    factionId:   number;
    factionName: string;
}

export async function fetchMyCharacters(guildId: string, userId: string) {
    return apiClient.get<PlayCharacter[]>('/play/entities/my-characters', { guildId, userId });
}
