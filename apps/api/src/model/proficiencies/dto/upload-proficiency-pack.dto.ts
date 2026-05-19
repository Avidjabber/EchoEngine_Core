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

export interface UploadResultRow {
    row:     number;
    input:   string;
    status:  'added' | 'updated' | 'failed';
    reason?: string;
}

export interface UploadProficiencyPackNewResult {
    added:   number;
    updated: number;
    failed:  number;
    rows:    UploadResultRow[];
}

export type UpsertOneProficiencyResult =
    | { status: 'added';   codeName: string; name: string; stat: string }
    | { status: 'updated'; codeName: string; name: string; stat: string; oldName: string; oldStat: string }
    | { status: 'failed';  reason: string };

export interface ProficiencyTemplateData {
    stats:         string[];
    proficiencies: string[];
}

export interface ResetProficiencyPackResult {
    deleted: Array<{ codeName: string; name: string }>;
    failed:  Array<{ codeName: string; name: string; reason: string }>;
}
