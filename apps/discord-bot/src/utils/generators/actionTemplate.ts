import ExcelJS from 'exceljs';
import type { ActionPackTemplateData, ActionDownloadData } from '../../services/model/actionPackService';

const HEADER_STYLE: Partial<ExcelJS.Style> = {
    font:      { bold: true },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
    alignment: { vertical: 'middle' },
};

function styleHeaderRow(row: ExcelJS.Row): void {
    row.eachCell(cell => { cell.style = HEADER_STYLE; });
    row.height = 18;
}

function addRefColumns(sheet: ExcelJS.Worksheet, columns: { header: string; values: string[] }[]): void {
    sheet.columns = columns.map(c => ({ header: c.header, key: c.header, width: 28 }));
    styleHeaderRow(sheet.getRow(1));
    const maxRows = Math.max(...columns.map(c => c.values.length), 0);
    for (let i = 0; i < maxRows; i++) {
        const rowData: Record<string, string> = {};
        for (const col of columns) rowData[col.header] = col.values[i] ?? '';
        sheet.addRow(rowData);
    }
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function addBaseConfigsSheet(workbook: ExcelJS.Workbook, rows?: ActionDownloadData['baseConfigs']): void {
    const sheet = workbook.addWorksheet('base_configs');
    sheet.columns = [
        { header: 'action',             key: 'action',             width: 28 },
        { header: 'energy_cost',        key: 'energy_cost',        width: 14 },
        { header: 'daily_limit',        key: 'daily_limit',        width: 14 },
        { header: 'min_entities',       key: 'min_entities',       width: 14 },
        { header: 'max_entities',       key: 'max_entities',       width: 14 },
        { header: 'duration_minutes',   key: 'duration_minutes',   width: 18 },
        { header: 'base_faction_reward', key: 'base_faction_reward', width: 20 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.getRow(1).getCell('action').note           = 'Internal action type name. Must match a value from the reference tab — guilds cannot create custom actions.';
    sheet.getRow(1).getCell('daily_limit').note      = 'null = energy-only limit; integer = max starts per entity per day';
    sheet.getRow(1).getCell('max_entities').note     = 'null = unlimited';
    sheet.getRow(1).getCell('duration_minutes').note = 'null = resolves immediately on next tick';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({
                action:             r.action,
                energy_cost:        r.energyCost,
                daily_limit:        r.dailyLimit        ?? '',
                min_entities:       r.minEntities,
                max_entities:       r.maxEntities       ?? '',
                duration_minutes:   r.durationMinutes   ?? '',
                base_faction_reward: r.baseFactionReward,
            });
        }
    }
}

function addDisciplineRewardsSheet(workbook: ExcelJS.Workbook, rows?: ActionDownloadData['disciplineRewards']): void {
    const sheet = workbook.addWorksheet('discipline_rewards');
    sheet.columns = [
        { header: 'action',         key: 'action',         width: 28 },
        { header: 'discipline',     key: 'discipline',     width: 28 },
        { header: 'xp_amount',      key: 'xp_amount',      width: 12 },
        { header: 'recipient_scope', key: 'recipient_scope', width: 22 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.getRow(1).getCell('recipient_scope').note = 'all | leader_only | participants_only | winners_only | losers_only';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({ action: r.action, discipline: r.discipline, xp_amount: r.xpAmount, recipient_scope: r.recipientScope });
        }
    }
}

function addStepConfigsSheet(workbook: ExcelJS.Workbook, rows?: ActionDownloadData['stepConfigs']): void {
    const sheet = workbook.addWorksheet('step_configs');
    sheet.columns = [
        { header: 'action',      key: 'action',      width: 28 },
        { header: 'step',        key: 'step',        width: 28 },
        { header: 'proficiency', key: 'proficiency', width: 28 },
        { header: 'stat',        key: 'stat',        width: 20 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.getRow(1).getCell('proficiency').note = 'Set proficiency OR stat, not both. Leave both blank to use the engine default stat.';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({ action: r.action, step: r.step, proficiency: r.proficiency ?? '', stat: r.stat ?? '' });
        }
    }
}

function addDisciplineRequirementsSheet(workbook: ExcelJS.Workbook, rows?: ActionDownloadData['disciplineRequirements']): void {
    const sheet = workbook.addWorksheet('discipline_requirements');
    sheet.columns = [
        { header: 'action',     key: 'action',     width: 28 },
        { header: 'discipline', key: 'discipline', width: 28 },
        { header: 'min_level',  key: 'min_level',  width: 12 },
        { header: 'scope',      key: 'scope',      width: 12 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.getRow(1).getCell('scope').note = '"leader" = only leader must meet level; "all" = every participant must meet level';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({ action: r.action, discipline: r.discipline, min_level: r.minLevel, scope: r.scope });
        }
    }
}

function addReferenceSheet(workbook: ExcelJS.Workbook, data: ActionPackTemplateData): void {
    const refSheet = workbook.addWorksheet('reference');
    addRefColumns(refSheet, [
        { header: 'Action Types',        values: data.actionTypes },
        { header: 'Disciplines',         values: data.disciplines },
        { header: 'Proficiencies',       values: data.proficiencies },
        { header: 'Stats',               values: data.stats },
        { header: 'Recipient Scopes',    values: data.recipientScopes },
        { header: 'Requirement Scopes',  values: data.requirementScopes },
        { header: 'Steps (action | step)', values: data.steps.map(s => `${s.action} | ${s.step}`) },
    ]);
}

export async function generateActionTemplate(data: ActionPackTemplateData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    addBaseConfigsSheet(workbook);
    const baseSheet = workbook.getWorksheet('base_configs')!;
    for (const action of data.actionTypes) {
        baseSheet.addRow({ action, energy_cost: '', daily_limit: '', min_entities: '', max_entities: '', duration_minutes: '', base_faction_reward: '' });
    }

    addDisciplineRewardsSheet(workbook);

    addStepConfigsSheet(workbook);
    const stepSheet = workbook.getWorksheet('step_configs')!;
    for (const s of data.steps) {
        stepSheet.addRow({ action: s.action, step: s.step, proficiency: '', stat: '' });
    }

    addDisciplineRequirementsSheet(workbook);
    addReferenceSheet(workbook, data);
    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}

export async function generateActionDownload(data: ActionDownloadData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    addBaseConfigsSheet(workbook, data.baseConfigs);
    addDisciplineRewardsSheet(workbook, data.disciplineRewards);
    addStepConfigsSheet(workbook, data.stepConfigs);
    addDisciplineRequirementsSheet(workbook, data.disciplineRequirements);
    addReferenceSheet(workbook, data.templateData);
    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}
