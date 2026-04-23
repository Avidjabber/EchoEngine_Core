import ExcelJS from 'exceljs';
import { Readable } from 'stream';

export interface WorldModifierRow {
    row:        number;
    condition:  string | null;
    effectType: string | null;
    relation:   string | null;
    value:      number | null;
}

export interface StatModifierRow {
    row:       number;
    condition: string | null;
    stat:      string | null;
    value:     number | null;
}

export interface ProficiencyModifierRow {
    row:             number;
    condition:       string | null;
    proficiency:     string | null;
    value:           number | null;
    hasDisadvantage: boolean | null;
}

export interface ParsedEnvConditionPack {
    worldModifiers:       WorldModifierRow[];
    statModifiers:        StatModifierRow[];
    proficiencyModifiers: ProficiencyModifierRow[];
}

type CellValue = string | number | boolean | null | undefined;

function cellStr(val: CellValue): string | null {
    if (val === null || val === undefined || val === '') return null;
    return String(val).trim() || null;
}

function cellNum(val: CellValue): number | null {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
}

function cellBool(val: CellValue): boolean | null {
    if (typeof val === 'boolean') return val;
    if (val === null || val === undefined) return null;
    const s = String(val).toLowerCase().trim();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
    return null;
}

function buildHeaderMap(rowValues: CellValue[]): Record<number, string> {
    const map: Record<number, string> = {};
    rowValues.forEach((val, idx) => {
        if (idx === 0) return;
        const header = cellStr(val);
        if (header) map[idx] = header.toLowerCase().replace(/\s+/g, '_');
    });
    return map;
}

function rowToRecord(rowValues: CellValue[], headerMap: Record<number, string>): Record<string, CellValue> {
    const record: Record<string, CellValue> = {};
    rowValues.forEach((val, idx) => {
        const header = headerMap[idx];
        if (header !== undefined) record[header] = val ?? null;
    });
    return record;
}

function isEmptyRow(record: Record<string, CellValue>): boolean {
    return Object.values(record).every(v => v === null || v === undefined || v === '');
}

export async function parseEnvConditionPack(buffer: Buffer): Promise<ParsedEnvConditionPack> {
    const result: ParsedEnvConditionPack = {
        worldModifiers:       [],
        statModifiers:        [],
        proficiencyModifiers: [],
    };

    const stream = Readable.from(buffer);
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
        sharedStrings: 'cache',
        styles:        'ignore',
        hyperlinks:    'ignore',
        worksheets:    'emit',
        entries:       'emit',
    });

    workbookReader.read();

    for await (const worksheet of workbookReader) {
        const sheetName = worksheet.name.toLowerCase().replace(/\s+/g, '_');
        let headerMap: Record<number, string> = {};
        let rowIndex = 0;

        if (sheetName === 'world_modifiers') {
            for await (const row of worksheet) {
                rowIndex++;
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); continue; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) continue;
                result.worldModifiers.push({
                    row:        rowIndex,
                    condition:  cellStr(r['condition']),
                    effectType: cellStr(r['effect_type']),
                    relation:   cellStr(r['relation']),
                    value:      cellNum(r['value']),
                });
            }
        } else if (sheetName === 'stat_modifiers') {
            for await (const row of worksheet) {
                rowIndex++;
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); continue; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) continue;
                result.statModifiers.push({
                    row:       rowIndex,
                    condition: cellStr(r['condition']),
                    stat:      cellStr(r['stat']),
                    value:     cellNum(r['value']),
                });
            }
        } else if (sheetName === 'proficiency_modifiers') {
            for await (const row of worksheet) {
                rowIndex++;
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); continue; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) continue;
                result.proficiencyModifiers.push({
                    row:             rowIndex,
                    condition:       cellStr(r['condition']),
                    proficiency:     cellStr(r['proficiency']),
                    value:           cellNum(r['value']),
                    hasDisadvantage: cellBool(r['has_disadvantage']),
                });
            }
        }
    }

    return result;
}
