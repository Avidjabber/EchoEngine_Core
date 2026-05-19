import { apiClient } from '../api';

export interface UploadResultRow {
    row:     number;
    sheet:   string;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface ItemPackUploadResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
}

export interface ItemTemplateData {
    measurementTypes:    string[];
    fuelTypes:           string[];
    itemTypes:           string[];
    slotTypes:           string[];
    damageTypes:         string[];
    stats:               string[];
    actionCategories:    string[];
    itemActionTypes:     string[];
    targetScopes:        string[];
    behaviorEffectTypes: string[];
    itemInteractions:    string[];
    symptoms:            string[];
    relationTypes:       string[];
    speciesCodes:        string[];
    eventDefCodes:       string[];
    existingItems:       string[];
}

export interface ResetItemPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}

export function fetchItemTemplateData(guildId: string) {
    return apiClient.get<ItemTemplateData>('/model/items/template-data', { guildId });
}

export function uploadItemPack(guildId: string, fileBuffer: Buffer) {
    return apiClient.postMultipart<ItemPackUploadResult>(
        '/model/items/upload',
        { guildId },
        { name: 'items.xlsx', buffer: fileBuffer },
        120_000,
    );
}

export function resetItemPack(guildId: string) {
    return apiClient.post<ResetItemPackResult>('/model/items/reset', { guildId });
}
