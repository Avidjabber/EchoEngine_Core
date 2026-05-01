import ExcelJS from 'exceljs';

export interface WeatherPatternTemplateData {
    weatherStates: string[];
    seasons:       string[];
}

export interface WeatherPatternDownloadItem {
    codeName:     string;
    name:         string;
    isSevere:     boolean;
    cooldownDays: number;
    steps: {
        stepOrder:    number;
        durationHours: number;
        weatherState: string | null;
    }[];
    seasonWeights: {
        season:  string;
        weight:  number;
    }[];
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

function addRefSheet(workbook: ExcelJS.Workbook, data: WeatherPatternTemplateData): void {
    const sheet = workbook.addWorksheet('reference');
    sheet.columns = [
        { header: 'weather_state', key: 'weather_state', width: 28 },
        { header: 'season',        key: 'season',        width: 20 },
    ];
    styleHeaderRow(sheet.getRow(1));

    const maxRows = Math.max(data.weatherStates.length, data.seasons.length);
    for (let i = 0; i < maxRows; i++) {
        sheet.addRow({
            weather_state: data.weatherStates[i] ?? '',
            season:        data.seasons[i] ?? '',
        });
    }
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function generateWeatherPatternTemplate(data: WeatherPatternTemplateData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const patternsSheet = workbook.addWorksheet('patterns');
    patternsSheet.columns = [
        { header: 'code_name',    key: 'code_name',    width: 28 },
        { header: 'name',         key: 'name',         width: 28 },
        { header: 'is_severe',    key: 'is_severe',    width: 12 },
        { header: 'cooldown_days', key: 'cooldown_days', width: 16 },
    ];
    styleHeaderRow(patternsSheet.getRow(1));
    patternsSheet.getRow(1).getCell('code_name').note    = 'snake_case slug, unique per guild. This is the permanent identifier — changing it creates a new pattern.';
    patternsSheet.getRow(1).getCell('is_severe').note    = 'TRUE or FALSE. Severe patterns are admin-triggered only and never picked during normal daily weather selection.';
    patternsSheet.getRow(1).getCell('cooldown_days').note = 'Minimum days before this pattern can be selected again. 0 = no cooldown.';
    patternsSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const stepsSheet = workbook.addWorksheet('steps');
    stepsSheet.columns = [
        { header: 'pattern',       key: 'pattern',       width: 28 },
        { header: 'step_order',    key: 'step_order',    width: 14 },
        { header: 'weather_state', key: 'weather_state', width: 28 },
        { header: 'duration_hours', key: 'duration_hours', width: 16 },
    ];
    styleHeaderRow(stepsSheet.getRow(1));
    stepsSheet.getRow(1).getCell('pattern').note       = 'Must match a code_name from the patterns sheet.';
    stepsSheet.getRow(1).getCell('step_order').note    = 'Positive integer. Determines playback order within the pattern.';
    stepsSheet.getRow(1).getCell('weather_state').note = 'Must match a weather state code_name for this guild (see reference sheet). Leave blank to use the season\'s default weather state.';
    stepsSheet.getRow(1).getCell('duration_hours').note = 'How long this step lasts in hours. Must be a positive integer.';
    stepsSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const weightsSheet = workbook.addWorksheet('season_weights');
    weightsSheet.columns = [
        { header: 'pattern', key: 'pattern', width: 28 },
        { header: 'season',  key: 'season',  width: 20 },
        { header: 'weight',  key: 'weight',  width: 12 },
    ];
    styleHeaderRow(weightsSheet.getRow(1));
    weightsSheet.getRow(1).getCell('pattern').note = 'Must match a code_name from the patterns sheet.';
    weightsSheet.getRow(1).getCell('season').note  = 'Must match a season name (see reference sheet). Add one row per season this pattern should be eligible for.';
    weightsSheet.getRow(1).getCell('weight').note  = 'Relative spawn weight (positive number). Higher weight = selected more often. Omit a season to make the pattern ineligible for it.';
    weightsSheet.views = [{ state: 'frozen', ySplit: 1 }];

    addRefSheet(workbook, data);

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}

export async function generateWeatherPatternDownload(
    patterns:     WeatherPatternDownloadItem[],
    templateData: WeatherPatternTemplateData,
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const patternsSheet = workbook.addWorksheet('patterns');
    patternsSheet.columns = [
        { header: 'code_name',    key: 'code_name',    width: 28 },
        { header: 'name',         key: 'name',         width: 28 },
        { header: 'is_severe',    key: 'is_severe',    width: 12 },
        { header: 'cooldown_days', key: 'cooldown_days', width: 16 },
    ];
    styleHeaderRow(patternsSheet.getRow(1));
    patternsSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const p of patterns) {
        patternsSheet.addRow({ code_name: p.codeName, name: p.name, is_severe: p.isSevere, cooldown_days: p.cooldownDays });
    }

    const stepsSheet = workbook.addWorksheet('steps');
    stepsSheet.columns = [
        { header: 'pattern',       key: 'pattern',       width: 28 },
        { header: 'step_order',    key: 'step_order',    width: 14 },
        { header: 'weather_state', key: 'weather_state', width: 28 },
        { header: 'duration_hours', key: 'duration_hours', width: 16 },
    ];
    styleHeaderRow(stepsSheet.getRow(1));
    stepsSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const p of patterns) {
        for (const s of p.steps) {
            stepsSheet.addRow({
                pattern:       p.codeName,
                step_order:    s.stepOrder,
                weather_state: s.weatherState ?? '',
                duration_hours: s.durationHours,
            });
        }
    }

    const weightsSheet = workbook.addWorksheet('season_weights');
    weightsSheet.columns = [
        { header: 'pattern', key: 'pattern', width: 28 },
        { header: 'season',  key: 'season',  width: 20 },
        { header: 'weight',  key: 'weight',  width: 12 },
    ];
    styleHeaderRow(weightsSheet.getRow(1));
    weightsSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const p of patterns) {
        for (const sw of p.seasonWeights) {
            weightsSheet.addRow({ pattern: p.codeName, season: sw.season, weight: sw.weight });
        }
    }

    addRefSheet(workbook, templateData);

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}
