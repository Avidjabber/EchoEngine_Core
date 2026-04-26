export interface BaseConfigRowDto {
    row:               number;
    action:            string | null;
    energyCost:        number | null;
    dailyLimit:        number | null;
    minEntities:       number | null;
    maxEntities:       number | null;
    durationMinutes:   number | null;
    baseFactionReward: number | null;
}

export interface DisciplineRewardRowDto {
    row:            number;
    action:         string | null;
    discipline:     string | null;
    xpAmount:       number | null;
    recipientScope: string | null;
}

export interface StepConfigRowDto {
    row:         number;
    action:      string | null;
    step:        string | null;
    proficiency: string | null;
    stat:        string | null;
}

export interface DisciplineRequirementRowDto {
    row:        number;
    action:     string | null;
    discipline: string | null;
    minLevel:   number | null;
    scope:      string | null;
}

export interface UploadActionPackDto {
    guildId:                string;
    baseConfigs:            BaseConfigRowDto[];
    disciplineRewards:      DisciplineRewardRowDto[];
    stepConfigs:            StepConfigRowDto[];
    disciplineRequirements: DisciplineRequirementRowDto[];
}

export interface RowError {
    sheet:   string;
    row:     number;
    input:   string;
    message: string;
}

export type SavedRow =
    | { sheet: 'base_configs';             row: number; action: string }
    | { sheet: 'discipline_rewards';       row: number; action: string; discipline: string; recipientScope: string; xpAmount: number }
    | { sheet: 'step_configs';             row: number; action: string; step: string; proficiency: string | null; stat: string | null }
    | { sheet: 'discipline_requirements';  row: number; action: string; discipline: string };

export type OverwrittenRow =
    | { sheet: 'base_configs';             row: number; action: string }
    | { sheet: 'discipline_rewards';       row: number; action: string; discipline: string; recipientScope: string; oldXpAmount: number; newXpAmount: number }
    | { sheet: 'step_configs';             row: number; action: string; step: string; oldProficiency: string | null; oldStat: string | null; newProficiency: string | null; newStat: string | null }
    | { sheet: 'discipline_requirements';  row: number; action: string; discipline: string; oldMinLevel: number; newMinLevel: number };

export interface UploadActionPackResult {
    saved:      SavedRow[];
    errors:     RowError[];
    overwrites: OverwrittenRow[];
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
