import { apiClient } from '../api';

export interface EnvConditionTemplateData {
    envConditions:   string[];
    effectTypes:     string[];
    relations:       string[];
    stats:           string[];
    proficiencyDefs: string[];
}

export interface UploadResultRow {
    row:     number;
    sheet:   string;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface UploadEnvConditionResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
}

export interface DownloadWorldModifier {
    condition:  string;
    effectType: string;
    relation:   string;
    value:      number | null;
}

export interface DownloadStatModifier {
    condition: string;
    stat:      string;
    value:     number;
}

export interface DownloadProficiencyModifier {
    condition:       string;
    proficiency:     string;
    value:           number;
    hasDisadvantage: boolean;
    hasAdvantage:    boolean;
}

export interface EnvConditionModifiersData {
    worldModifiers:       DownloadWorldModifier[];
    statModifiers:        DownloadStatModifier[];
    proficiencyModifiers: DownloadProficiencyModifier[];
}

export interface EnvConditionListItem {
    codeName: string;
    name:     string;
}

export interface EnvConditionInfoData {
    conditions:           EnvConditionListItem[];
    worldModifiers:       DownloadWorldModifier[];
    statModifiers:        DownloadStatModifier[];
    proficiencyModifiers: DownloadProficiencyModifier[];
}

export async function fetchEnvConditionInfoData(guildId: string): Promise<{ success: true; value: EnvConditionInfoData } | { success: false; value: null }> {
    const [conditionsResult, modifiersResult] = await Promise.all([
        apiClient.get<EnvConditionListItem[]>('/model/env-conditions/conditions', {}),
        apiClient.get<EnvConditionModifiersData>('/model/env-conditions/modifiers', { guildId }),
    ]);

    if (!conditionsResult.success || !modifiersResult.success) {
        return { success: false, value: null };
    }

    return {
        success: true,
        value: {
            conditions:           conditionsResult.value!,
            worldModifiers:       modifiersResult.value!.worldModifiers,
            statModifiers:        modifiersResult.value!.statModifiers,
            proficiencyModifiers: modifiersResult.value!.proficiencyModifiers,
        },
    };
}

export async function fetchEnvConditionModifiers(guildId: string) {
    return apiClient.get<EnvConditionModifiersData>(
        '/model/env-conditions/modifiers',
        { guildId },
    );
}

export interface EnvConditionDownloadData {
    templateData:         EnvConditionTemplateData;
    worldModifiers:       DownloadWorldModifier[];
    statModifiers:        DownloadStatModifier[];
    proficiencyModifiers: DownloadProficiencyModifier[];
}

export async function removeEnvConditionModifier(
    guildId:      string,
    condition:    string,
    modifierType: 'world' | 'stat' | 'proficiency',
    key:          string,
) {
    return apiClient.post<{ removed: boolean }>('/model/env-conditions/modifier-remove', { guildId, condition, modifierType, key });
}

export async function resetEnvConditionForCondition(guildId: string, conditionCodeName: string) {
    return apiClient.post<EnvConditionResetResult>('/model/env-conditions/condition-reset', { guildId, conditionCodeName });
}

export async function fetchEnvConditionTemplateData(guildId: string) {
    return apiClient.get<EnvConditionTemplateData>(
        '/model/env-conditions/template-data',
        { guildId },
    );
}

export interface EnvConditionResetResult {
    worldModifiers:       number;
    statModifiers:        number;
    proficiencyModifiers: number;
}

export async function resetEnvConditionPack(guildId: string) {
    return apiClient.post<EnvConditionResetResult>('/model/env-conditions/reset', { guildId });
}

export async function fetchEnvConditionDownloadData(guildId: string) {
    return apiClient.get<EnvConditionDownloadData>(
        '/model/env-conditions/download',
        { guildId },
    );
}

export async function uploadEnvConditionPack(guildId: string, fileBuffer: Buffer) {
    return apiClient.postMultipart<UploadEnvConditionResult>(
        '/model/env-conditions/upload',
        { guildId },
        { name: 'env-conditions.xlsx', buffer: fileBuffer },
    );
}
