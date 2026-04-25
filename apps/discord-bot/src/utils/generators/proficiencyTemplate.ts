import ExcelJS from 'exceljs';
import type { ProficiencyTemplateData } from '../../services/model/proficiencyPackService';

const HEADER_STYLE: Partial<ExcelJS.Style> = {
    font:      { bold: true },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
    alignment: { vertical: 'middle' },
};

function styleHeaderRow(row: ExcelJS.Row): void {
    row.eachCell(cell => { cell.style = HEADER_STYLE; });
    row.height = 18;
}

export async function generateProficiencyTemplate(data: ProficiencyTemplateData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const profSheet = workbook.addWorksheet('proficiencies');
    profSheet.columns = [
        { header: 'code_name',   key: 'code_name',   width: 28 },
        { header: 'name',        key: 'name',        width: 24 },
        { header: 'stat',        key: 'stat',        width: 18 },
        { header: 'description', key: 'description', width: 40 },
    ];
    styleHeaderRow(profSheet.getRow(1));
    profSheet.getRow(1).getCell('code_name').note = 'snake_case slug, unique per guild. This is the permanent identifier — changing it creates a new proficiency.';
    profSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const refSheet = workbook.addWorksheet('reference');
    refSheet.columns = [
        { header: 'Stats',         key: 'stats',         width: 18 },
        { header: 'Proficiencies', key: 'proficiencies', width: 28 },
    ];
    styleHeaderRow(refSheet.getRow(1));
    const maxRows = Math.max(data.stats.length, data.proficiencies.length);
    for (let i = 0; i < maxRows; i++) {
        refSheet.addRow({
            stats:         data.stats[i]         ?? '',
            proficiencies: data.proficiencies[i] ?? '',
        });
    }
    refSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}
