import ExcelJS from 'exceljs';

export interface BaseConfigRow {
    row:               number;
    action:            string | null;
    energyCost:        number | null;
    dailyLimit:        number | null;
    minEntities:       number | null;
    maxEntities:       number | null;
    durationMinutes:   number | null;
    baseFactionReward: number | null;
}

export interface DisciplineRewardRow {
    row:            number;
    action:         string | null;
    discipline:     string | null;
    xpAmount:       number | null;
    recipientScope: string | null;
}

export interface StepConfigRow {
    row:         number;
    action:      string | null;
    step:        string | null;
    proficiency: string | null;
    stat:        string | null;
}

export interface DisciplineRequirementRow {
    row:        number;
    action:     string | null;
    discipline: string | null;
    minLevel:   number | null;
    scope:      string | null;
}

export interface ParsedActionPack {
    baseConfigs:            BaseConfigRow[];
    disciplineRewards:      DisciplineRewardRow[];
    stepConfigs:            StepConfigRow[];
    disciplineRequirements: DisciplineRequirementRow[];
}

type CellValue = string | number | boolean | null | undefined;

function cellStr(val: CellValue): string | null {
    if (val === null || val === undefined || val === '') return null;
    return String(val).trim() || null;
}

function cellNum(val: CellValue): number | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const n = Number(String(val).trim());
    return isNaN(n) ? null : n;
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

export async function parseActionPack(buffer: Buffer): Promise<ParsedActionPack> {
    const result: ParsedActionPack = {
        baseConfigs: [], disciplineRewards: [], stepConfigs: [], disciplineRequirements: [],
    };

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    for (const worksheet of workbook.worksheets) {
        const sheetName = worksheet.name.toLowerCase().replace(/\s+/g, '_');

        if (sheetName === 'base_configs') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.baseConfigs.push({
                    row:               rowIndex,
                    action:            cellStr(r['action']),
                    energyCost:        cellNum(r['energy_cost']),
                    dailyLimit:        cellNum(r['daily_limit']),
                    minEntities:       cellNum(r['min_entities']),
                    maxEntities:       cellNum(r['max_entities']),
                    durationMinutes:   cellNum(r['duration_minutes']),
                    baseFactionReward: cellNum(r['base_faction_reward']),
                });
            });
        }

        if (sheetName === 'discipline_rewards') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.disciplineRewards.push({
                    row:            rowIndex,
                    action:         cellStr(r['action']),
                    discipline:     cellStr(r['discipline']),
                    xpAmount:       cellNum(r['xp_amount']),
                    recipientScope: cellStr(r['recipient_scope']),
                });
            });
        }

        if (sheetName === 'step_configs') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.stepConfigs.push({
                    row:         rowIndex,
                    action:      cellStr(r['action']),
                    step:        cellStr(r['step']),
                    proficiency: cellStr(r['proficiency']),
                    stat:        cellStr(r['stat']),
                });
            });
        }

        if (sheetName === 'discipline_requirements') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.disciplineRequirements.push({
                    row:        rowIndex,
                    action:     cellStr(r['action']),
                    discipline: cellStr(r['discipline']),
                    minLevel:   cellNum(r['min_level']),
                    scope:      cellStr(r['scope']),
                });
            });
        }
    }

    return result;
}
