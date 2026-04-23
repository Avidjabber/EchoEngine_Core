import { apiClient } from '../api';
import type { WorldModifierRow, StatModifierRow, ProficiencyModifierRow } from '../../utils/parsers/envConditionPack';

export interface EnvConditionTemplateData {
    envConditions:   string[];
    effectTypes:     string[];
    relations:       string[];
    stats:           string[];
    proficiencyDefs: string[];
}

export type SavedRow =
    | { sheet: 'world_modifiers';       row: number; condition: string; effectType: string; relation: string; value: number | null }
    | { sheet: 'stat_modifiers';        row: number; condition: string; stat: string; value: number }
    | { sheet: 'proficiency_modifiers'; row: number; condition: string; proficiency: string; value: number; hasDisadvantage: boolean };

export interface RowError {
    sheet:   string;
    row:     number;
    input:   string;
    message: string;
}

export interface EnvConditionPackUploadResult {
    saved:  SavedRow[];
    errors: RowError[];
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
}

export interface EnvConditionDownloadData {
    templateData:         EnvConditionTemplateData;
    worldModifiers:       DownloadWorldModifier[];
    statModifiers:        DownloadStatModifier[];
    proficiencyModifiers: DownloadProficiencyModifier[];
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

export async function uploadEnvConditionPack(
    guildId:              string,
    worldModifiers:       WorldModifierRow[],
    statModifiers:        StatModifierRow[],
    proficiencyModifiers: ProficiencyModifierRow[],
) {
    return apiClient.post<EnvConditionPackUploadResult>('/model/env-conditions/upload', {
        guildId,
        worldModifiers:       worldModifiers.map(r => ({
            row:        r.row,
            condition:  r.condition,
            effectType: r.effectType,
            relation:   r.relation,
            value:      r.value,
        })),
        statModifiers:        statModifiers.map(r => ({
            row:       r.row,
            condition: r.condition,
            stat:      r.stat,
            value:     r.value,
        })),
        proficiencyModifiers: proficiencyModifiers.map(r => ({
            row:             r.row,
            condition:       r.condition,
            proficiency:     r.proficiency,
            value:           r.value,
            hasDisadvantage: r.hasDisadvantage,
        })),
    });
}
