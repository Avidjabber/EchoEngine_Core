import ExcelJS from 'exceljs';

export interface WeatherStateRow {
    row:      number;
    codeName: string | null;
    name:     string | null;
    isSevere: boolean | null;
}

export interface WeatherStateEnvConditionRow {
    row:          number;
    weatherState: string | null;
    envCondition: string | null;
}

export interface ParsedWeatherStatePack {
    states:        WeatherStateRow[];
    envConditions: WeatherStateEnvConditionRow[];
}

type CellValue = string | number | boolean | null | undefined;

function cellStr(val: CellValue): string | null {
    if (val === null || val === undefined || val === '') return null;
    return String(val).trim() || null;
}

function cellBool(val: CellValue): boolean | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'boolean') return val;
    const s = String(val).trim().toLowerCase();
    if (s === 'true' || s === 'yes' || s === '1') return true;
    if (s === 'false' || s === 'no' || s === '0') return false;
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

export async function parseWeatherStatePack(buffer: Buffer): Promise<ParsedWeatherStatePack> {
    const result: ParsedWeatherStatePack = { states: [], envConditions: [] };

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    for (const worksheet of workbook.worksheets) {
        const sheetName = worksheet.name.toLowerCase().replace(/\s+/g, '_');

        if (sheetName === 'weather_states') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.states.push({
                    row:      rowIndex,
                    codeName: cellStr(r['code_name']),
                    name:     cellStr(r['name']),
                    isSevere: cellBool(r['is_severe']),
                });
            });
        }

        if (sheetName === 'env_conditions') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.envConditions.push({
                    row:          rowIndex,
                    weatherState: cellStr(r['weather_state']),
                    envCondition: cellStr(r['env_condition']),
                });
            });
        }
    }

    return result;
}
