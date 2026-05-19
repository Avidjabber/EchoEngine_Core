import ExcelJS from 'exceljs';
import type { ConditionTemplateData, ConditionDownloadData } from '../../services/model/conditionPackService';

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

function addConditionsSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['conditions']): void {
    const sheet = workbook.addWorksheet('conditions');
    sheet.columns = [
        { header: 'code_name',                         key: 'code_name',                         width: 28 },
        { header: 'name',                              key: 'name',                              width: 28 },
        { header: 'description',                       key: 'description',                       width: 40 },
        { header: 'condition_type',                    key: 'condition_type',                    width: 22 },
        { header: 'condition_context',                 key: 'condition_context',                 width: 22 },
        { header: 'is_death_save_failure_consequence', key: 'is_death_save_failure_consequence', width: 32 },
        { header: 'is_hidden',                         key: 'is_hidden',                         width: 12 },
        { header: 'is_fatal_at_cap',                   key: 'is_fatal_at_cap',                   width: 16 },
        { header: 'progression_cap',                   key: 'progression_cap',                   width: 16 },
        { header: 'daily_roll_dc',                     key: 'daily_roll_dc',                     width: 14 },
        { header: 'max_days',                          key: 'max_days',                          width: 12 },
        { header: 'duration_minutes',                  key: 'duration_minutes',                  width: 18 },
        { header: 'spawn_threshold',                   key: 'spawn_threshold',                   width: 16 },
        { header: 'contagion_resist_dc',               key: 'contagion_resist_dc',               width: 18 },
        { header: 'energy_debuf',                      key: 'energy_debuf',                      width: 14 },
        { header: 'blocks_verbal',                     key: 'blocks_verbal',                     width: 14 },
        { header: 'blocks_somatic',                    key: 'blocks_somatic',                    width: 15 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.getRow(1).getCell('code_name').note = 'snake_case slug, unique per guild. Permanent identifier — changing it creates a new condition.';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({
                code_name:                         r.codeName,
                name:                              r.name,
                description:                       r.description ?? '',
                condition_type:                    r.conditionType,
                condition_context:                 r.conditionContext,
                is_death_save_failure_consequence: r.isDeathSaveFailureConsequence,
                is_hidden:                         r.isHidden,
                is_fatal_at_cap:                   r.isFatalAtCap,
                progression_cap:                   r.progressionCap ?? '',
                daily_roll_dc:                     r.dailyRollDC   ?? '',
                max_days:                          r.maxDays        ?? '',
                duration_minutes:                  r.durationMinutes ?? '',
                spawn_threshold:                   r.spawnThreshold  ?? '',
                contagion_resist_dc:               r.contagionResistDC ?? '',
                energy_debuf:                      r.energyDebuf    ?? '',
                blocks_verbal:                     r.blocksVerbal,
                blocks_somatic:                    r.blocksSomatic,
            });
        }
    }
}

function addStatEffectsSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['statEffects']): void {
    const sheet = workbook.addWorksheet('stat_effects');
    sheet.columns = [
        { header: 'condition_code_name', key: 'condition_code_name', width: 28 },
        { header: 'stat',                key: 'stat',                width: 20 },
        { header: 'amount',              key: 'amount',              width: 12 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) sheet.addRow({ condition_code_name: r.conditionCodeName, stat: r.stat, amount: r.amount });
    }
}

function addProfEffectsSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['profEffects']): void {
    const sheet = workbook.addWorksheet('prof_effects');
    sheet.columns = [
        { header: 'condition_code_name', key: 'condition_code_name', width: 28 },
        { header: 'proficiency_code',    key: 'proficiency_code',    width: 28 },
        { header: 'amount',              key: 'amount',              width: 12 },
        { header: 'has_disadvantage',    key: 'has_disadvantage',    width: 16 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({ condition_code_name: r.conditionCodeName, proficiency_code: r.proficiencyCode, amount: r.amount ?? '', has_disadvantage: r.hasDisadvantage });
        }
    }
}

function addCombatEffectsSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['combatEffects']): void {
    const sheet = workbook.addWorksheet('combat_effects');
    sheet.columns = [
        { header: 'condition_code_name', key: 'condition_code_name', width: 28 },
        { header: 'effect_type',         key: 'effect_type',         width: 24 },
        { header: 'stat',                key: 'stat',                width: 20 },
        { header: 'flat_modifier',       key: 'flat_modifier',       width: 14 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({ condition_code_name: r.conditionCodeName, effect_type: r.effectType, stat: r.stat ?? '', flat_modifier: r.flatModifier ?? '' });
        }
    }
}

function addCombatStatEffectsSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['combatStatEffects']): void {
    const sheet = workbook.addWorksheet('combat_stat_effects');
    sheet.columns = [
        { header: 'condition_code_name', key: 'condition_code_name', width: 28 },
        { header: 'effect_def_code',     key: 'effect_def_code',     width: 28 },
        { header: 'application_chance',  key: 'application_chance',  width: 18 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({ condition_code_name: r.conditionCodeName, effect_def_code: r.effectDefCode, application_chance: r.applicationChance });
        }
    }
}

function addDamageModifiersSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['damageModifiers']): void {
    const sheet = workbook.addWorksheet('damage_modifiers');
    sheet.columns = [
        { header: 'condition_code_name', key: 'condition_code_name', width: 28 },
        { header: 'damage_type',         key: 'damage_type',         width: 20 },
        { header: 'is_resistant',        key: 'is_resistant',        width: 14 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.getRow(1).getCell('is_resistant').note = 'true = half damage (resistant); false = no damage (immune)';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) sheet.addRow({ condition_code_name: r.conditionCodeName, damage_type: r.damageType, is_resistant: r.isResistant });
    }
}

function addEnvRulesSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['envRules']): void {
    const sheet = workbook.addWorksheet('env_rules');
    sheet.columns = [
        { header: 'condition_code_name', key: 'condition_code_name', width: 28 },
        { header: 'env_condition_code',  key: 'env_condition_code',  width: 28 },
        { header: 'relation_type',       key: 'relation_type',       width: 18 },
        { header: 'value',               key: 'value',               width: 10 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.getRow(1).getCell('value').note = 'Float > 0.0 and <= 2.0. Modifier applied to the daily roll DC.';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) sheet.addRow({ condition_code_name: r.conditionCodeName, env_condition_code: r.envConditionCode, relation_type: r.relationType, value: r.value });
    }
}

function addSymptomTagsSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['symptomTags']): void {
    const sheet = workbook.addWorksheet('symptom_tags');
    sheet.columns = [
        { header: 'condition_code_name', key: 'condition_code_name', width: 28 },
        { header: 'symptom',             key: 'symptom',             width: 24 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) sheet.addRow({ condition_code_name: r.conditionCodeName, symptom: r.symptom });
    }
}

function addGrantedItemsSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['grantedItems']): void {
    const sheet = workbook.addWorksheet('granted_items');
    sheet.columns = [
        { header: 'condition_code_name',  key: 'condition_code_name',  width: 28 },
        { header: 'item_code_name',        key: 'item_code_name',        width: 28 },
        { header: 'granted_to_source',     key: 'granted_to_source',     width: 18 },
        { header: 'uses_per_application',  key: 'uses_per_application',  width: 20 },
        { header: 'min_progression',       key: 'min_progression',       width: 16 },
        { header: 'max_progression',       key: 'max_progression',       width: 16 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({
                condition_code_name:  r.conditionCodeName,
                item_code_name:        r.itemCodeName,
                granted_to_source:     r.grantedToSource,
                uses_per_application:  r.usesPerApplication ?? '',
                min_progression:       r.minProgression     ?? '',
                max_progression:       r.maxProgression     ?? '',
            });
        }
    }
}

function addLinksSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['links']): void {
    const sheet = workbook.addWorksheet('links');
    sheet.columns = [
        { header: 'parent_condition_code', key: 'parent_condition_code', width: 28 },
        { header: 'child_condition_code',  key: 'child_condition_code',  width: 28 },
        { header: 'relation_type',         key: 'relation_type',         width: 18 },
        { header: 'weight',                key: 'weight',                width: 10 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({ parent_condition_code: r.parentConditionCode, child_condition_code: r.childConditionCode, relation_type: r.relationType, weight: r.weight });
        }
    }
}

function addBehaviorEffectsSheet(workbook: ExcelJS.Workbook, rows?: ConditionDownloadData['behaviorEffects']): void {
    const sheet = workbook.addWorksheet('behavior_effects');
    sheet.columns = [
        { header: 'condition_code_name',  key: 'condition_code_name',  width: 28 },
        { header: 'action_type',          key: 'action_type',          width: 22 },
        { header: 'perspective',          key: 'perspective',          width: 14 },
        { header: 'behavior_type',        key: 'behavior_type',        width: 20 },
        { header: 'trigger_chance',       key: 'trigger_chance',       width: 16 },
        { header: 'redirect_target',      key: 'redirect_target',      width: 20 },
        { header: 'bias_weight',          key: 'bias_weight',          width: 14 },
        { header: 'restrict_action_type', key: 'restrict_action_type', width: 22 },
        { header: 'restrict_is_block',    key: 'restrict_is_block',    width: 16 },
    ];
    styleHeaderRow(sheet.getRow(1));
    sheet.getRow(1).getCell('perspective').note    = "'outgoing' or 'incoming'";
    sheet.getRow(1).getCell('trigger_chance').note = '0.0–1.0; 1.0 = always fires';
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (rows) {
        for (const r of rows) {
            sheet.addRow({
                condition_code_name:  r.conditionCodeName,
                action_type:          r.actionType          ?? '',
                perspective:          r.perspective,
                behavior_type:        r.behaviorType,
                trigger_chance:       r.triggerChance,
                redirect_target:      r.redirectTarget      ?? '',
                bias_weight:          r.biasWeight          ?? '',
                restrict_action_type: r.restrictActionType  ?? '',
                restrict_is_block:    r.restrictIsBlock,
            });
        }
    }
}

function addReferenceSheet(workbook: ExcelJS.Workbook, data: ConditionTemplateData): void {
    const refSheet = workbook.addWorksheet('reference');
    addRefColumns(refSheet, [
        { header: 'Condition Types',         values: data.conditionTypes },
        { header: 'Condition Contexts',      values: data.conditionContexts },
        { header: 'Stats',                   values: data.stats },
        { header: 'Proficiency Codes',       values: data.proficiencyCodes },
        { header: 'Combat Effect Types',     values: data.combatEffectTypes },
        { header: 'Combat Stat Effect Codes', values: data.combatStatEffectCodes },
        { header: 'Damage Types',            values: data.damageTypes },
        { header: 'Env Condition Codes',     values: data.envConditionCodes },
        { header: 'Symptoms',                values: data.symptoms },
        { header: 'Item Codes',              values: data.itemCodes },
        { header: 'Item Action Types',       values: data.itemActionTypes },
        { header: 'Behavior Types',          values: data.behaviorTypes },
        { header: 'Redirect Targets',        values: data.redirectTargets },
        { header: 'Condition Relation Types', values: data.conditionRelationTypes },
        { header: 'Existing Conditions',     values: data.existingConditions },
    ]);
}

export async function generateConditionTemplate(data: ConditionTemplateData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    addConditionsSheet(workbook);
    addStatEffectsSheet(workbook);
    addProfEffectsSheet(workbook);
    addCombatEffectsSheet(workbook);
    addCombatStatEffectsSheet(workbook);
    addDamageModifiersSheet(workbook);
    addEnvRulesSheet(workbook);
    addSymptomTagsSheet(workbook);
    addGrantedItemsSheet(workbook);
    addLinksSheet(workbook);
    addBehaviorEffectsSheet(workbook);
    addReferenceSheet(workbook, data);
    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}

export async function generateConditionDownload(data: ConditionDownloadData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    addConditionsSheet(workbook, data.conditions);
    addStatEffectsSheet(workbook, data.statEffects);
    addProfEffectsSheet(workbook, data.profEffects);
    addCombatEffectsSheet(workbook, data.combatEffects);
    addCombatStatEffectsSheet(workbook, data.combatStatEffects);
    addDamageModifiersSheet(workbook, data.damageModifiers);
    addEnvRulesSheet(workbook, data.envRules);
    addSymptomTagsSheet(workbook, data.symptomTags);
    addGrantedItemsSheet(workbook, data.grantedItems);
    addLinksSheet(workbook, data.links);
    addBehaviorEffectsSheet(workbook, data.behaviorEffects);
    addReferenceSheet(workbook, data.templateData);
    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}
