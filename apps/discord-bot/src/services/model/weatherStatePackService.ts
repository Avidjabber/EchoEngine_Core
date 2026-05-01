import { apiClient } from '../api';
import type { WeatherStateRow, WeatherStateEnvConditionRow } from '../../utils/parsers/weatherStatePack';

export interface WeatherStateTemplateData {
    envConditions: string[];
}

export interface WeatherStateSavedRow {
    row:      number;
    codeName: string;
    name:     string;
    isSevere: boolean;
}

export interface WeatherStateOverwrittenRow {
    row:       number;
    codeName:  string;
    oldName:   string;
    newName:   string;
    oldSevere: boolean;
    newSevere: boolean;
}

export interface RowError {
    row:     number;
    input:   string;
    message: string;
}

export interface WeatherStatePackUploadResult {
    saved:      WeatherStateSavedRow[];
    errors:     RowError[];
    overwrites: WeatherStateOverwrittenRow[];
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

export async function uploadWeatherStatePack(
    guildId:       string,
    states:        WeatherStateRow[],
    envConditions: WeatherStateEnvConditionRow[],
) {
    return apiClient.post<WeatherStatePackUploadResult>('/model/weather-states/upload', {
        guildId,
        states: states.map(r => ({
            row:      r.row,
            codeName: r.codeName,
            name:     r.name,
            isSevere: r.isSevere,
        })),
        envConditions: envConditions.map(r => ({
            row:          r.row,
            weatherState: r.weatherState,
            envCondition: r.envCondition,
        })),
    });
}

export async function resetWeatherStatePack(guildId: string) {
    return apiClient.post<ResetWeatherStatePackResult>('/model/weather-states/reset', { guildId });
}
