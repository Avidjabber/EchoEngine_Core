import ExcelJS from 'exceljs';
import { Readable } from 'stream';

export interface ProficiencyRow {
    row:         number;
    codeName:    string | null;
    name:        string | null;
    stat:        string | null;
    description: string | null;
}

export interface ParsedProficiencyPack {
    proficiencies: ProficiencyRow[];
}

type CellValue = string | number | boolean | null | undefined;

function cellStr(val: CellValue): string | null {
    if (val === null || val === undefined || val === '') return null;
    return String(val).trim() || null;
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

export async function parseProficiencyPack(buffer: Buffer): Promise<ParsedProficiencyPack> {
    const result: ParsedProficiencyPack = { proficiencies: [] };

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
        const sheetName = (worksheet as unknown as { name: string }).name.toLowerCase().replace(/\s+/g, '_');
        if (sheetName !== 'proficiencies') continue;

        let headerMap: Record<number, string> = {};
        let rowIndex = 0;

        for await (const row of worksheet) {
            rowIndex++;
            const vals = row.values as CellValue[];
            if (rowIndex === 1) { headerMap = buildHeaderMap(vals); continue; }
            const r = rowToRecord(vals, headerMap);
            if (isEmptyRow(r)) continue;
            result.proficiencies.push({
                row:         rowIndex,
                codeName:    cellStr(r['code_name']),
                name:        cellStr(r['name']),
                stat:        cellStr(r['stat']),
                description: cellStr(r['description']),
            });
        }
    }

    return result;
}
