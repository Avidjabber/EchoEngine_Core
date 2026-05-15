import { apiClient } from '../api';
import type { ParsedItemPack } from '../../utils/parsers/itemPack';

export interface RowError {
    row:     number;
    input:   string;
    message: string;
}

export interface ItemSavedRow {
    row:      number;
    codeName: string;
    name:     string;
}

export interface ItemOverwrittenRow {
    row:      number;
    codeName: string;
    oldName:  string;
    newName:  string;
}

export interface ItemPackUploadResult {
    saved:      ItemSavedRow[];
    overwrites: ItemOverwrittenRow[];
    errors:     RowError[];
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

export function uploadItemPack(guildId: string, pack: ParsedItemPack) {
    return apiClient.post<ItemPackUploadResult>('/model/items/upload', {
        guildId,
        items:     pack.items,
        equipment: pack.equipment,
        food:      pack.food,
        actions:   pack.actions,
        effects:   pack.effects,
    });
}

export function resetItemPack(guildId: string) {
    return apiClient.post<ResetItemPackResult>('/model/items/reset', { guildId });
}
