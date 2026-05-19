
export interface UploadResultRow {
    row:     number;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface UploadWeatherPatternPackResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
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


export interface WeatherPatternTemplateData {
    weatherStates: string[];
    seasons:       string[];
}

export interface ResetWeatherPatternPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}
