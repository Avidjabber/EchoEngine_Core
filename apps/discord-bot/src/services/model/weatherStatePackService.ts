import { apiClient } from '../api';

export interface WeatherStateTemplateData {
    envConditions: string[];
}

export interface UploadResultRow {
    row:     number;
    sheet:   string;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface UploadWeatherStatePackResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
}

export interface ResetWeatherStatePackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}

export interface WeatherStateListItem {
    codeName:      string;
    name:          string;
    isSevere:      boolean;
    envConditions: string[];
}

export async function fetchWeatherStateTemplateData(guildId: string) {
    return apiClient.get<WeatherStateTemplateData>('/model/weather-states/template-data', { guildId });
}

export async function fetchAllWeatherStates(guildId: string) {
    return apiClient.get<WeatherStateListItem[]>('/model/weather-states/all', { guildId });
}

export async function uploadWeatherStatePack(guildId: string, fileBuffer: Buffer) {
    return apiClient.postMultipart<UploadWeatherStatePackResult>(
        '/model/weather-states/upload',
        { guildId },
        { name: 'weather-states.xlsx', buffer: fileBuffer },
    );
}

export async function resetWeatherStatePack(guildId: string) {
    return apiClient.post<ResetWeatherStatePackResult>('/model/weather-states/reset', { guildId });
}
