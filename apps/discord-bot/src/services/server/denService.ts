import { apiClient } from '../api';

export interface Den {
    id: number;
    guildId: string;
    channelId: string;
}

export interface CreateDenResponse {
    den: Den;
    firstTimeSetup: boolean;
}

export async function removeDen(guildId: string, channelId: string) {
    return apiClient.delete<void>(`/server/dens?guildId=${encodeURIComponent(guildId)}&channelId=${encodeURIComponent(channelId)}`);
}

export async function getDens(guildId: string) {
    return apiClient.get<Den[]>(`/server/dens?guildId=${encodeURIComponent(guildId)}`);
}

export async function createDen(guildId: string, channelId: string, ownerId: string) {
    return apiClient.post<CreateDenResponse>('/server/dens', { guildId, channelId, ownerId });
}
