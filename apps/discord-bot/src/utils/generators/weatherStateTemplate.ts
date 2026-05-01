import ExcelJS from 'exceljs';

export interface WeatherStateTemplateData {
    envConditions: string[];
}

export interface WeatherStateDownloadItem {
    codeName:      string;
    name:          string;
    isSevere:      boolean;
    envConditions: string[];
}

const HEADER_STYLE: Partial<ExcelJS.Style> = {
    font:      { bold: true },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
    alignment: { vertical: 'middle' },
};

function styleHeaderRow(row: ExcelJS.Row): void {
    row.eachCell(cell => { cell.style = HEADER_STYLE; });
    row.height = 18;
}

function addRefSheet(workbook: ExcelJS.Workbook, envConditions: string[]): void {
    const sheet = workbook.addWorksheet('reference');
    sheet.columns = [{ header: 'Env Conditions', key: 'env_conditions', width: 28 }];
    styleHeaderRow(sheet.getRow(1));
    for (const ec of envConditions) {
        sheet.addRow({ env_conditions: ec });
    }
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function generateWeatherStateTemplate(data: WeatherStateTemplateData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const statesSheet = workbook.addWorksheet('weather_states');
    statesSheet.columns = [
        { header: 'code_name', key: 'code_name', width: 28 },
        { header: 'name',      key: 'name',      width: 28 },
        { header: 'is_severe', key: 'is_severe', width: 12 },
    ];
    styleHeaderRow(statesSheet.getRow(1));
    statesSheet.getRow(1).getCell('code_name').note = 'snake_case slug, unique per guild. This is the permanent identifier — changing it creates a new weather state.';
    statesSheet.getRow(1).getCell('is_severe').note  = 'TRUE or FALSE. Severe states are admin-triggered only and never picked during normal daily weather selection.';
    statesSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const ecSheet = workbook.addWorksheet('env_conditions');
    ecSheet.columns = [
        { header: 'weather_state', key: 'weather_state', width: 28 },
        { header: 'env_condition', key: 'env_condition', width: 28 },
    ];
    styleHeaderRow(ecSheet.getRow(1));
    ecSheet.getRow(1).getCell('weather_state').note = 'Must match a code_name from the weather_states sheet.';
    ecSheet.getRow(1).getCell('env_condition').note  = 'Must match a valid env condition codeName (see reference sheet). Add one row per linked condition.';
    ecSheet.views = [{ state: 'frozen', ySplit: 1 }];

    addRefSheet(workbook, data.envConditions);

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}

export async function generateWeatherStateDownload(
    states:       WeatherStateDownloadItem[],
    templateData: WeatherStateTemplateData,
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const statesSheet = workbook.addWorksheet('weather_states');
    statesSheet.columns = [
        { header: 'code_name', key: 'code_name', width: 28 },
        { header: 'name',      key: 'name',      width: 28 },
        { header: 'is_severe', key: 'is_severe', width: 12 },
    ];
    styleHeaderRow(statesSheet.getRow(1));
    statesSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const s of states) {
        statesSheet.addRow({ code_name: s.codeName, name: s.name, is_severe: s.isSevere });
    }

    const ecSheet = workbook.addWorksheet('env_conditions');
    ecSheet.columns = [
        { header: 'weather_state', key: 'weather_state', width: 28 },
        { header: 'env_condition', key: 'env_condition', width: 28 },
    ];
    styleHeaderRow(ecSheet.getRow(1));
    ecSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const s of states) {
        for (const ec of s.envConditions) {
            ecSheet.addRow({ weather_state: s.codeName, env_condition: ec });
        }
    }

    addRefSheet(workbook, templateData.envConditions);

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}
