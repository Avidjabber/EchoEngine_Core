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

export interface ProficiencyDef {
    codeName:    string;
    name:        string;
    stat:        string;
    description: string | null;
}

export async function fetchProficiencyTemplateData(guildId: string) {
    return apiClient.get<ProficiencyTemplateData>('/model/proficiencies/template-data', { guildId });
}

export interface ProficiencyListItem {
    codeName:    string;
    name:        string;
    stat:        string;
    description: string | null;
}

export async function fetchAllProficiencies(guildId: string) {
    return apiClient.get<ProficiencyListItem[]>('/model/proficiencies/all', { guildId });
}

export async function fetchProficiencyByCodeName(guildId: string, codeName: string) {
    return apiClient.get<ProficiencyDef>('/model/proficiencies/one', { guildId, codeName });
}

export type DeleteCheckResult =
    | { status: 'not_found' }
    | { status: 'has_dependencies'; name: string }
    | { status: 'ok'; name: string };

export async function checkDeleteProficiency(guildId: string, codeName: string) {
    return apiClient.get<DeleteCheckResult>('/model/proficiencies/delete-check', { guildId, codeName });
}

export async function deleteProficiency(guildId: string, codeName: string) {
    return apiClient.post<{ deleted: boolean }>('/model/proficiencies/delete-one', { guildId, codeName });
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
    }, 120_000);
}

export async function resetProficiencyPack(guildId: string) {
    return apiClient.post<ResetProficiencyPackResult>('/model/proficiencies/reset', { guildId });
}
