import ExcelJS from 'exceljs';
import { Readable } from 'stream';

export interface WeatherPatternRow {
    row:          number;
    codeName:     string | null;
    name:         string | null;
    isSevere:     boolean | null;
    cooldownDays: number | null;
}

export interface WeatherPatternStepRow {
    row:           number;
    pattern:       string | null;
    stepOrder:     number | null;
    weatherState:  string | null;
    durationHours: number | null;
}

export interface WeatherPatternSeasonWeightRow {
    row:     number;
    pattern: string | null;
    season:  string | null;
    weight:  number | null;
}

export interface ParsedWeatherPatternPack {
    patterns:      WeatherPatternRow[];
    steps:         WeatherPatternStepRow[];
    seasonWeights: WeatherPatternSeasonWeightRow[];
}

const TIER_WEIGHTS: Record<string, number> = {
    'common':    10,
    'uncommon':  5,
    'rare':      2,
    'very rare': 1,
    'very_rare': 1,
};

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

function cellNum(val: CellValue): number | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const n = Number(String(val).trim());
    return isNaN(n) ? null : n;
}

function cellTier(val: CellValue): number | null {
    if (val === null || val === undefined || val === '') return null;
    const key = String(val).trim().toLowerCase();
    return TIER_WEIGHTS[key] ?? null;
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

export async function parseWeatherPatternPack(buffer: Buffer): Promise<ParsedWeatherPatternPack> {
    const result: ParsedWeatherPatternPack = { patterns: [], steps: [], seasonWeights: [] };

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

        if (sheetName === 'patterns') {
            let headerMap: Record<number, string> = {};
            let rowIndex = 0;
            for await (const row of worksheet) {
                rowIndex++;
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); continue; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) continue;
                result.patterns.push({
                    row:          rowIndex,
                    codeName:     cellStr(r['code_name']),
                    name:         cellStr(r['name']),
                    isSevere:     cellBool(r['is_severe']),
                    cooldownDays: cellNum(r['cooldown_days']),
                });
            }
        }

        if (sheetName === 'steps') {
            let headerMap: Record<number, string> = {};
            let rowIndex = 0;
            for await (const row of worksheet) {
                rowIndex++;
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); continue; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) continue;
                result.steps.push({
                    row:           rowIndex,
                    pattern:       cellStr(r['pattern']),
                    stepOrder:     cellNum(r['step_order']),
                    weatherState:  cellStr(r['weather_state']),
                    durationHours: cellNum(r['duration_hours']),
                });
            }
        }

        if (sheetName === 'season_weights') {
            let headerMap: Record<number, string> = {};
            let rowIndex = 0;
            for await (const row of worksheet) {
                rowIndex++;
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); continue; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) continue;
                result.seasonWeights.push({
                    row:     rowIndex,
                    pattern: cellStr(r['pattern']),
                    season:  cellStr(r['season']),
                    weight:  cellTier(r['weight']),
                });
            }
        }
    }

    return result;
}
