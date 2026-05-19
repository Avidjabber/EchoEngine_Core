import { apiClient } from '../api';

export interface WeatherPatternTemplateData {
    weatherStates: string[];
    seasons:       string[];
}


export interface ResetWeatherPatternPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}

export interface UploadResultRow {
    row:     number;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface UploadWeatherPatternPackResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
}

export interface WeatherPatternListItem {
    codeName:     string;
    name:         string;
    isSevere:     boolean;
    cooldownDays: number;
    steps: {
        stepOrder:    number;
        durationHours: number;
        weatherState: string | null;
    }[];
    seasonWeights: {
        season:  string;
        weight:  number;
    }[];
}

export async function fetchWeatherPatternTemplateData(guildId: string) {
    return apiClient.get<WeatherPatternTemplateData>('/model/weather-patterns/template-data', { guildId });
}

export async function fetchAllWeatherPatterns(guildId: string) {
    return apiClient.get<WeatherPatternListItem[]>('/model/weather-patterns/all', { guildId });
}

export async function uploadWeatherPatternPack(guildId: string, fileBuffer: Buffer) {
    return apiClient.postMultipart<UploadWeatherPatternPackResult>(
        '/model/weather-patterns/upload',
        { guildId },
        { name: 'weather-patterns.xlsx', buffer: fileBuffer },
    );
}

export async function resetWeatherPatternPack(guildId: string) {
    return apiClient.post<ResetWeatherPatternPackResult>('/model/weather-patterns/reset', { guildId });
}

export async function downloadWeatherPatternPack(guildId: string) {
    return apiClient.getBuffer('/model/weather-patterns/download', { guildId });
}
