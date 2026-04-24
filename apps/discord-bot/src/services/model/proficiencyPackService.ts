import { apiClient } from '../api';
import type { ProficiencyRow } from '../../utils/parsers/proficiencyPack';

export interface ProficiencyTemplateData {
    stats:         string[];
    proficiencies: string[];
}

export interface ProficiencySavedRow {
    row:      number;
    codeName: string;
    name:     string;
    stat:     string;
}

export interface ProficiencyOverwrittenRow {
    row:      number;
    codeName: string;
    oldName:  string;
    newName:  string;
    oldStat:  string;
    newStat:  string;
}

export interface RowError {
    row:     number;
    input:   string;
    message: string;
}

export interface ProficiencyPackUploadResult {
    saved:      ProficiencySavedRow[];
    errors:     RowError[];
    overwrites: ProficiencyOverwrittenRow[];
}

export interface ResetProficiencyPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}

export async function fetchProficiencyTemplateData(guildId: string) {
    return apiClient.get<ProficiencyTemplateData>('/model/proficiencies/template-data', { guildId });
}

export async function uploadProficiencyPack(guildId: string, rows: ProficiencyRow[]) {
    return apiClient.post<ProficiencyPackUploadResult>('/model/proficiencies/upload', {
        guildId,
        rows: rows.map(r => ({
            row:         r.row,
            codeName:    r.codeName,
            name:        r.name,
            stat:        r.stat,
            description: r.description,
        })),
    });
}

export async function resetProficiencyPack(guildId: string) {
    return apiClient.post<ResetProficiencyPackResult>('/model/proficiencies/reset', { guildId });
}
