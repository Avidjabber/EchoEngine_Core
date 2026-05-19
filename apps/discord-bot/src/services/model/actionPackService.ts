import { apiClient } from '../api';

export interface UploadResultRow {
    row:     number;
    sheet:   string;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface ActionPackUploadResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
}

export interface ActionPackTemplateData {
    actionTypes:       string[];
    disciplines:       string[];
    proficiencies:     string[];
    stats:             string[];
    recipientScopes:   string[];
    requirementScopes: string[];
    steps:             { action: string; step: string }[];
}

export interface ResetActionPackResult {
    deletedBaseConfigs:            number;
    deletedDisciplineRewards:      number;
    deletedStepConfigs:            number;
    deletedDisciplineRequirements: number;
}

export interface DownloadBaseConfigRow {
    action:            string;
    energyCost:        number;
    dailyLimit:        number | null;
    minEntities:       number;
    maxEntities:       number | null;
    durationMinutes:   number | null;
    baseFactionReward: number;
}

export interface DownloadDisciplineRewardRow {
    action:         string;
    discipline:     string;
    xpAmount:       number;
    recipientScope: string;
}

export interface DownloadStepConfigRow {
    action:      string;
    step:        string;
    proficiency: string | null;
    stat:        string | null;
}

export interface DownloadDisciplineRequirementRow {
    action:     string;
    discipline: string;
    minLevel:   number;
    scope:      string;
}

export interface ActionDownloadData {
    baseConfigs:            DownloadBaseConfigRow[];
    disciplineRewards:      DownloadDisciplineRewardRow[];
    stepConfigs:            DownloadStepConfigRow[];
    disciplineRequirements: DownloadDisciplineRequirementRow[];
    templateData:           ActionPackTemplateData;
}

export function uploadActionPack(guildId: string, fileBuffer: Buffer) {
    return apiClient.postMultipart<ActionPackUploadResult>(
        '/model/actions/upload',
        { guildId },
        { name: 'actions.xlsx', buffer: fileBuffer },
        120_000,
    );
}

export function fetchActionTemplateData(guildId: string) {
    return apiClient.get<ActionPackTemplateData>('/model/actions/template-data', { guildId });
}

export function fetchActionDownloadData(guildId: string) {
    return apiClient.get<ActionDownloadData>('/model/actions/download', { guildId });
}

export function resetActionPack(guildId: string) {
    return apiClient.post<ResetActionPackResult>('/model/actions/reset', { guildId });
}
