export interface WorldModifierDto {
    row:        number;
    condition:  string | null;
    effectType: string | null;
    relation:   string | null;
    value:      number | null;
}

export interface StatModifierDto {
    row:       number;
    condition: string | null;
    stat:      string | null;
    value:     number | null;
}

export interface ProficiencyModifierDto {
    row:             number;
    condition:       string | null;
    proficiency:     string | null;
    value:           number | null;
    hasDisadvantage: boolean | null;
}

export interface UploadEnvConditionPackDto {
    guildId:              string;
    worldModifiers:       WorldModifierDto[];
    statModifiers:        StatModifierDto[];
    proficiencyModifiers: ProficiencyModifierDto[];
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

export interface UploadEnvConditionPackResult {
    saved:  SavedRow[];
    errors: RowError[];
}

export interface EnvConditionTemplateData {
    envConditions:   string[];
    effectTypes:     string[];
    relations:       string[];
    stats:           string[];
    proficiencyDefs: string[];
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

export interface EnvConditionResetResult {
    worldModifiers:       number;
    statModifiers:        number;
    proficiencyModifiers: number;
}

export interface EnvConditionDownloadData {
    templateData:         EnvConditionTemplateData;
    worldModifiers:       DownloadWorldModifier[];
    statModifiers:        DownloadStatModifier[];
    proficiencyModifiers: DownloadProficiencyModifier[];
}
