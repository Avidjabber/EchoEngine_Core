export interface ProficiencyRowDto {
    row:         number;
    codeName:    string | null;
    name:        string | null;
    stat:        string | null;
    description: string | null;
}

export interface UploadProficiencyPackDto {
    guildId: string;
    rows:    ProficiencyRowDto[];
}

export interface ProficiencySavedRow {
    row:      number;
    codeName: string;
    name:     string;
    stat:     string;
}

export interface ProficiencyOverwrittenRow {
    row:      number;
    codeName: string;
    oldName:  string;
    newName:  string;
    oldStat:  string;
    newStat:  string;
}

export interface RowError {
    row:     number;
    input:   string;
    message: string;
}

export interface UploadProficiencyPackResult {
    saved:      ProficiencySavedRow[];
    errors:     RowError[];
    overwrites: ProficiencyOverwrittenRow[];
}

export interface ProficiencyTemplateData {
    stats:         string[];
    proficiencies: string[];
}

export interface ResetProficiencyPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}
