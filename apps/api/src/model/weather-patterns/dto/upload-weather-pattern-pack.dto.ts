export interface PatternRowDto {
    row:          number;
    codeName:     string | null;
    name:         string | null;
    isSevere:     boolean | null;
    cooldownDays: number | null;
}

export interface PatternStepRowDto {
    row:           number;
    pattern:       string | null;
    stepOrder:     number | null;
    weatherState:  string | null;  // null = use season default
    durationHours: number | null;
}

export interface PatternSeasonWeightRowDto {
    row:     number;
    pattern: string | null;
    season:  string | null;
    weight:  number | null;
}

export interface UploadWeatherPatternPackDto {
    guildId:       string;
    patterns:      PatternRowDto[];
    steps:         PatternStepRowDto[];
    seasonWeights: PatternSeasonWeightRowDto[];
}

export interface PatternSavedRow {
    row:          number;
    codeName:     string;
    name:         string;
    isSevere:     boolean;
    cooldownDays: number;
    stepCount:    number;
}

export interface PatternOverwrittenRow {
    row:             number;
    codeName:        string;
    oldName:         string;
    newName:         string;
    oldSevere:       boolean;
    newSevere:       boolean;
    oldCooldownDays: number;
    newCooldownDays: number;
}

export interface RowError {
    row:     number;
    input:   string;
    message: string;
}

export interface UploadWeatherPatternPackResult {
    saved:      PatternSavedRow[];
    errors:     RowError[];
    overwrites: PatternOverwrittenRow[];
}

export interface WeatherPatternTemplateData {
    weatherStates: string[];
    seasons:       string[];
}

export interface ResetWeatherPatternPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}
