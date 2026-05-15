import { apiClient } from '../api';
import type { WeatherPatternRow, WeatherPatternStepRow, WeatherPatternSeasonWeightRow } from '../../utils/parsers/weatherPatternPack';

export interface WeatherPatternTemplateData {
    weatherStates: string[];
    seasons:       string[];
}

export interface PatternSavedRow {
    row:          number;
    codeName:     string;
    name:         string;
    isSevere:     boolean;
    cooldownDays: number;
    stepCount:    number;
}

export interface PatternOverwrittenRow {
    row:             number;
    codeName:        string;
    oldName:         string;
    newName:         string;
    oldSevere:       boolean;
    newSevere:       boolean;
    oldCooldownDays: number;
    newCooldownDays: number;
}

export interface RowError {
    row:     number;
    input:   string;
    message: string;
}

export interface WeatherPatternPackUploadResult {
    saved:      PatternSavedRow[];
    errors:     RowError[];
    overwrites: PatternOverwrittenRow[];
}

export interface ResetWeatherPatternPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
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

export async function uploadWeatherPatternPack(
    guildId:       string,
    patterns:      WeatherPatternRow[],
    steps:         WeatherPatternStepRow[],
    seasonWeights: WeatherPatternSeasonWeightRow[],
) {
    return apiClient.post<WeatherPatternPackUploadResult>('/model/weather-patterns/upload', {
        guildId,
        patterns: patterns.map(r => ({
            row:          r.row,
            codeName:     r.codeName,
            name:         r.name,
            isSevere:     r.isSevere,
            cooldownDays: r.cooldownDays,
        })),
        steps: steps.map(r => ({
            row:           r.row,
            pattern:       r.pattern,
            stepOrder:     r.stepOrder,
            weatherState:  r.weatherState,
            durationHours: r.durationHours,
        })),
        seasonWeights: seasonWeights.map(r => ({
            row:     r.row,
            pattern: r.pattern,
            season:  r.season,
            weight:  r.weight,
        })),
    }, 120_000);
}

export async function resetWeatherPatternPack(guildId: string) {
    return apiClient.post<ResetWeatherPatternPackResult>('/model/weather-patterns/reset', { guildId });
}
