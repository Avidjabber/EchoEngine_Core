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
