import { apiClient } from '../api';

export interface Den {
    id: number;
    guildId: string;
    channelId: string;
    allowWorldSim: boolean;
    allowConditions: boolean;
    allowCombat: boolean;
    allowActivities: boolean;
    allowEvents: boolean;
    allowCrafting: boolean;
    allowProgression: boolean;
    allowSocial: boolean;
}

export interface CreateDenResponse {
    den: Den;
    firstTimeSetup: boolean;
}

export interface UpdateDenPayload {
    guildId: string;
    channelId: string;
    allowWorldSim: boolean;
    allowConditions: boolean;
    allowCombat: boolean;
    allowActivities: boolean;
    allowEvents: boolean;
    allowCrafting: boolean;
    allowProgression: boolean;
    allowSocial: boolean;
}

export async function removeDen(guildId: string, channelId: string) {
    return apiClient.delete<void>(`/server/dens?guildId=${encodeURIComponent(guildId)}&channelId=${encodeURIComponent(channelId)}`);
}

export async function getDens(guildId: string) {
    return apiClient.get<Den[]>(`/server/dens?guildId=${encodeURIComponent(guildId)}`);
}

export async function getDen(guildId: string, channelId: string) {
    return apiClient.get<Den>(`/server/dens/single?guildId=${encodeURIComponent(guildId)}&channelId=${encodeURIComponent(channelId)}`);
}

export async function createDen(guildId: string, channelId: string, ownerId: string) {
    return apiClient.post<CreateDenResponse>('/server/dens', { guildId, channelId, ownerId });
}

export async function updateDen(payload: UpdateDenPayload) {
    return apiClient.patch<Den>('/server/dens', payload);
}
