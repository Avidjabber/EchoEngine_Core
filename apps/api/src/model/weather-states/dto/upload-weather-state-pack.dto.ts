export interface WeatherStateRowDto {
    row:      number;
    codeName: string | null;
    name:     string | null;
    isSevere: boolean | null;
}

export interface WeatherStateEnvConditionRowDto {
    row:          number;
    weatherState: string | null;
    envCondition: string | null;
}

export interface UploadWeatherStatePackDto {
    guildId:       string;
    states:        WeatherStateRowDto[];
    envConditions: WeatherStateEnvConditionRowDto[];
}

export interface WeatherStateSavedRow {
    row:      number;
    codeName: string;
    name:     string;
    isSevere: boolean;
}

export interface WeatherStateOverwrittenRow {
    row:        number;
    codeName:   string;
    oldName:    string;
    newName:    string;
    oldSevere:  boolean;
    newSevere:  boolean;
}

export interface RowError {
    row:     number;
    input:   string;
    message: string;
}

export interface UploadWeatherStatePackResult {
    saved:      WeatherStateSavedRow[];
    errors:     RowError[];
    overwrites: WeatherStateOverwrittenRow[];
}

export interface UploadResultRow {
    row:     number;
    sheet:   string;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface UploadWeatherStatePackNewResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
}

export interface WeatherStateTemplateData {
    envConditions: string[];
}

export interface ResetWeatherStatePackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}
