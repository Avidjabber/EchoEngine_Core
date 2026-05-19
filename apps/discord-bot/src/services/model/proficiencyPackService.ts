import { apiClient } from '../api';

export interface ProficiencyTemplateData {
    stats:         string[];
    proficiencies: string[];
}

export interface UploadResultRow {
    row:     number;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface ProficiencyPackUploadResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
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

export type UpsertOneProficiencyResult =
    | { status: 'added';   codeName: string; name: string; stat: string }
    | { status: 'updated'; codeName: string; name: string; stat: string; oldName: string; oldStat: string }
    | { status: 'failed';  reason: string };

export async function upsertProficiency(
    guildId:     string,
    codeName:    string,
    name:        string,
    stat:        string,
    description: string | null,
) {
    return apiClient.post<UpsertOneProficiencyResult>('/model/proficiencies/upsert-one', {
        guildId, codeName, name, stat, description,
    });
}

export async function uploadProficiencyPack(guildId: string, fileBuffer: Buffer) {
    return apiClient.postMultipart<ProficiencyPackUploadResult>(
        '/model/proficiencies/upload',
        { guildId },
        { name: 'proficiencies.xlsx', buffer: fileBuffer },
    );
}

export async function resetProficiencyPack(guildId: string) {
    return apiClient.post<ResetProficiencyPackResult>('/model/proficiencies/reset', { guildId });
}
