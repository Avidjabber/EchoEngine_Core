import ExcelJS from 'exceljs';
import type { EnvConditionTemplateData, EnvConditionDownloadData } from '../../services/model/envConditionPackService';

const HEADER_STYLE: Partial<ExcelJS.Style> = {
    font:      { bold: true },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
    alignment: { vertical: 'middle' },
};

function styleHeaderRow(row: ExcelJS.Row): void {
    row.eachCell(cell => {
        cell.style = HEADER_STYLE;
    });
    row.height = 18;
}

export async function generateEnvConditionTemplate(data: EnvConditionTemplateData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // world_modifiers sheet
    const worldSheet = workbook.addWorksheet('world_modifiers');
    worldSheet.columns = [
        { header: 'condition',   key: 'condition',   width: 28 },
        { header: 'effect_type', key: 'effect_type', width: 14 },
        { header: 'relation',    key: 'relation',    width: 12 },
        { header: 'value',       key: 'value',       width: 8  },
    ];
    styleHeaderRow(worldSheet.getRow(1));
    worldSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // stat_modifiers sheet
    const statSheet = workbook.addWorksheet('stat_modifiers');
    statSheet.columns = [
        { header: 'condition', key: 'condition', width: 28 },
        { header: 'stat',      key: 'stat',      width: 18 },
        { header: 'value',     key: 'value',     width: 8  },
    ];
    styleHeaderRow(statSheet.getRow(1));
    statSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // proficiency_modifiers sheet
    const profSheet = workbook.addWorksheet('proficiency_modifiers');
    profSheet.columns = [
        { header: 'condition',        key: 'condition',        width: 28 },
        { header: 'proficiency',      key: 'proficiency',      width: 22 },
        { header: 'value',            key: 'value',            width: 8  },
        { header: 'has_disadvantage', key: 'has_disadvantage', width: 18 },
    ];
    styleHeaderRow(profSheet.getRow(1));
    profSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // reference sheet
    const refSheet = workbook.addWorksheet('reference');
    refSheet.columns = [
        { header: 'Env Conditions',   key: 'envConditions',   width: 28 },
        { header: 'Effect Types',     key: 'effectTypes',     width: 14 },
        { header: 'Relations',        key: 'relations',       width: 12 },
        { header: 'Stats',            key: 'stats',           width: 18 },
        { header: 'Proficiency Defs', key: 'proficiencyDefs', width: 22 },
    ];
    styleHeaderRow(refSheet.getRow(1));

    const maxRows = Math.max(
        data.envConditions.length,
        data.effectTypes.length,
        data.relations.length,
        data.stats.length,
        data.proficiencyDefs.length,
    );

    for (let i = 0; i < maxRows; i++) {
        refSheet.addRow({
            envConditions:   data.envConditions[i]   ?? '',
            effectTypes:     data.effectTypes[i]     ?? '',
            relations:       data.relations[i]       ?? '',
            stats:           data.stats[i]           ?? '',
            proficiencyDefs: data.proficiencyDefs[i] ?? '',
        });
    }

    refSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}

export async function generateEnvConditionDownload(data: EnvConditionDownloadData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const worldSheet = workbook.addWorksheet('world_modifiers');
    worldSheet.columns = [
        { header: 'condition',   key: 'condition',   width: 28 },
        { header: 'effect_type', key: 'effect_type', width: 14 },
        { header: 'relation',    key: 'relation',    width: 12 },
        { header: 'value',       key: 'value',       width: 8  },
    ];
    styleHeaderRow(worldSheet.getRow(1));
    worldSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const row of data.worldModifiers) {
        worldSheet.addRow({
            condition:   row.condition,
            effect_type: row.effectType,
            relation:    row.relation,
            value:       row.value ?? '',
        });
    }

    const statSheet = workbook.addWorksheet('stat_modifiers');
    statSheet.columns = [
        { header: 'condition', key: 'condition', width: 28 },
        { header: 'stat',      key: 'stat',      width: 18 },
        { header: 'value',     key: 'value',     width: 8  },
    ];
    styleHeaderRow(statSheet.getRow(1));
    statSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const row of data.statModifiers) {
        statSheet.addRow({ condition: row.condition, stat: row.stat, value: row.value });
    }

    const profSheet = workbook.addWorksheet('proficiency_modifiers');
    profSheet.columns = [
        { header: 'condition',        key: 'condition',        width: 28 },
        { header: 'proficiency',      key: 'proficiency',      width: 22 },
        { header: 'value',            key: 'value',            width: 8  },
        { header: 'has_disadvantage', key: 'has_disadvantage', width: 18 },
    ];
    styleHeaderRow(profSheet.getRow(1));
    profSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const row of data.proficiencyModifiers) {
        profSheet.addRow({
            condition:        row.condition,
            proficiency:      row.proficiency,
            value:            row.value,
            has_disadvantage: row.hasDisadvantage ? 'TRUE' : 'FALSE',
        });
    }

    const refSheet = workbook.addWorksheet('reference');
    refSheet.columns = [
        { header: 'Env Conditions',   key: 'envConditions',   width: 28 },
        { header: 'Effect Types',     key: 'effectTypes',     width: 14 },
        { header: 'Relations',        key: 'relations',       width: 12 },
        { header: 'Stats',            key: 'stats',           width: 18 },
        { header: 'Proficiency Defs', key: 'proficiencyDefs', width: 22 },
    ];
    styleHeaderRow(refSheet.getRow(1));
    const ref = data.templateData;
    const maxRows = Math.max(
        ref.envConditions.length,
        ref.effectTypes.length,
        ref.relations.length,
        ref.stats.length,
        ref.proficiencyDefs.length,
    );
    for (let i = 0; i < maxRows; i++) {
        refSheet.addRow({
            envConditions:   ref.envConditions[i]   ?? '',
            effectTypes:     ref.effectTypes[i]     ?? '',
            relations:       ref.relations[i]       ?? '',
            stats:           ref.stats[i]           ?? '',
            proficiencyDefs: ref.proficiencyDefs[i] ?? '',
        });
    }
    refSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}
