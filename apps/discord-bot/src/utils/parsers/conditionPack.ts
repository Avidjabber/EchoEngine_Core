import ExcelJS from 'exceljs';

export interface ConditionRow {
    row:                     number;
    codeName:                string | null;
    name:                    string | null;
    description:             string | null;
    conditionType:           string | null;
    conditionContext:        string | null;
    isDeathSaveFailureConsequence: boolean | null;
    isHidden:                boolean | null;
    isFatalAtCap:            boolean | null;
    progressionCap:          number | null;
    dailyRollDC:             number | null;
    maxDays:                 number | null;
    durationMinutes:         number | null;
    spawnThreshold:          number | null;
    contagionResistDC:       number | null;
    energyDebuf:             number | null;
    blocksVerbal:            boolean | null;
    blocksSomatic:           boolean | null;
}

export interface ConditionStatEffectRow {
    row:               number;
    conditionCodeName: string | null;
    stat:              string | null;
    amount:            number | null;
}

export interface ConditionProfEffectRow {
    row:               number;
    conditionCodeName: string | null;
    proficiencyCode:   string | null;
    amount:            number | null;
    hasDisadvantage:   boolean | null;
}

export interface ConditionCombatEffectRow {
    row:               number;
    conditionCodeName: string | null;
    effectType:        string | null;
    stat:              string | null;
    flatModifier:      number | null;
}

export interface ConditionCombatStatEffectRow {
    row:               number;
    conditionCodeName: string | null;
    effectDefCode:     string | null;
    applicationChance: number | null;
}

export interface ConditionDamageModifierRow {
    row:               number;
    conditionCodeName: string | null;
    damageType:        string | null;
    isResistant:       boolean | null;
}

export interface ConditionEnvRuleRow {
    row:               number;
    conditionCodeName: string | null;
    envConditionCode:  string | null;
    relationType:      string | null;
    value:             number | null;
}

export interface ConditionSymptomTagRow {
    row:               number;
    conditionCodeName: string | null;
    symptom:           string | null;
}

export interface ConditionGrantedItemRow {
    row:                number;
    conditionCodeName:  string | null;
    itemCodeName:       string | null;
    grantedToSource:    boolean | null;
    usesPerApplication: number | null;
    minProgression:     number | null;
    maxProgression:     number | null;
}

export interface ConditionLinkRow {
    row:                 number;
    parentConditionCode: string | null;
    childConditionCode:  string | null;
    relationType:        string | null;
    weight:              number | null;
}

export interface ConditionBehaviorEffectRow {
    row:                number;
    conditionCodeName:  string | null;
    actionType:         string | null;
    perspective:        string | null;
    behaviorType:       string | null;
    triggerChance:      number | null;
    redirectTarget:     string | null;
    biasWeight:         number | null;
    restrictActionType: string | null;
    restrictIsBlock:    boolean | null;
}

export interface ParsedConditionPack {
    conditions:        ConditionRow[];
    statEffects:       ConditionStatEffectRow[];
    profEffects:       ConditionProfEffectRow[];
    combatEffects:     ConditionCombatEffectRow[];
    combatStatEffects: ConditionCombatStatEffectRow[];
    damageModifiers:   ConditionDamageModifierRow[];
    envRules:          ConditionEnvRuleRow[];
    symptomTags:       ConditionSymptomTagRow[];
    grantedItems:      ConditionGrantedItemRow[];
    links:             ConditionLinkRow[];
    behaviorEffects:   ConditionBehaviorEffectRow[];
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

export async function parseConditionPack(buffer: Buffer): Promise<ParsedConditionPack> {
    const result: ParsedConditionPack = {
        conditions:        [],
        statEffects:       [],
        profEffects:       [],
        combatEffects:     [],
        combatStatEffects: [],
        damageModifiers:   [],
        envRules:          [],
        symptomTags:       [],
        grantedItems:      [],
        links:             [],
        behaviorEffects:   [],
    };

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    for (const worksheet of workbook.worksheets) {
        const sheetName = worksheet.name.toLowerCase().replace(/\s+/g, '_');
        let headerMap: Record<number, string> = {};

        if (sheetName === 'conditions') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.conditions.push({
                    row:                     rowIndex,
                    codeName:                cellStr(r['code_name']),
                    name:                    cellStr(r['name']),
                    description:             cellStr(r['description']),
                    conditionType:           cellStr(r['condition_type']),
                    conditionContext:        cellStr(r['condition_context']),
                    isDeathSaveFailureConsequence: cellBool(r['is_death_save_failure_consequence']),
                    isHidden:                cellBool(r['is_hidden']),
                    isFatalAtCap:            cellBool(r['is_fatal_at_cap']),
                    progressionCap:          cellNum(r['progression_cap']),
                    dailyRollDC:             cellNum(r['daily_roll_dc']),
                    maxDays:                 cellNum(r['max_days']),
                    durationMinutes:         cellNum(r['duration_minutes']),
                    spawnThreshold:          cellNum(r['spawn_threshold']),
                    contagionResistDC:       cellNum(r['contagion_resist_dc']),
                    energyDebuf:             cellNum(r['energy_debuf']),
                    blocksVerbal:            cellBool(r['blocks_verbal']),
                    blocksSomatic:           cellBool(r['blocks_somatic']),
                });
            });

        } else if (sheetName === 'stat_effects') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.statEffects.push({
                    row:               rowIndex,
                    conditionCodeName: cellStr(r['condition_code_name']),
                    stat:              cellStr(r['stat']),
                    amount:            cellNum(r['amount']),
                });
            });

        } else if (sheetName === 'prof_effects') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.profEffects.push({
                    row:               rowIndex,
                    conditionCodeName: cellStr(r['condition_code_name']),
                    proficiencyCode:   cellStr(r['proficiency_code']),
                    amount:            cellNum(r['amount']),
                    hasDisadvantage:   cellBool(r['has_disadvantage']),
                });
            });

        } else if (sheetName === 'combat_effects') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.combatEffects.push({
                    row:               rowIndex,
                    conditionCodeName: cellStr(r['condition_code_name']),
                    effectType:        cellStr(r['effect_type']),
                    stat:              cellStr(r['stat']),
                    flatModifier:      cellNum(r['flat_modifier']),
                });
            });

        } else if (sheetName === 'combat_stat_effects') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.combatStatEffects.push({
                    row:               rowIndex,
                    conditionCodeName: cellStr(r['condition_code_name']),
                    effectDefCode:     cellStr(r['effect_def_code']),
                    applicationChance: cellNum(r['application_chance']),
                });
            });

        } else if (sheetName === 'damage_modifiers') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.damageModifiers.push({
                    row:               rowIndex,
                    conditionCodeName: cellStr(r['condition_code_name']),
                    damageType:        cellStr(r['damage_type']),
                    isResistant:       cellBool(r['is_resistant']),
                });
            });

        } else if (sheetName === 'env_rules') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.envRules.push({
                    row:               rowIndex,
                    conditionCodeName: cellStr(r['condition_code_name']),
                    envConditionCode:  cellStr(r['env_condition_code']),
                    relationType:      cellStr(r['relation_type']),
                    value:             cellNum(r['value']),
                });
            });

        } else if (sheetName === 'symptom_tags') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.symptomTags.push({
                    row:               rowIndex,
                    conditionCodeName: cellStr(r['condition_code_name']),
                    symptom:           cellStr(r['symptom']),
                });
            });

        } else if (sheetName === 'granted_items') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.grantedItems.push({
                    row:                rowIndex,
                    conditionCodeName:  cellStr(r['condition_code_name']),
                    itemCodeName:       cellStr(r['item_code_name']),
                    grantedToSource:    cellBool(r['granted_to_source']),
                    usesPerApplication: cellNum(r['uses_per_application']),
                    minProgression:     cellNum(r['min_progression']),
                    maxProgression:     cellNum(r['max_progression']),
                });
            });

        } else if (sheetName === 'links') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.links.push({
                    row:                 rowIndex,
                    parentConditionCode: cellStr(r['parent_condition_code']),
                    childConditionCode:  cellStr(r['child_condition_code']),
                    relationType:        cellStr(r['relation_type']),
                    weight:              cellNum(r['weight']),
                });
            });

        } else if (sheetName === 'behavior_effects') {
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.behaviorEffects.push({
                    row:                rowIndex,
                    conditionCodeName:  cellStr(r['condition_code_name']),
                    actionType:         cellStr(r['action_type']),
                    perspective:        cellStr(r['perspective']),
                    behaviorType:       cellStr(r['behavior_type']),
                    triggerChance:      cellNum(r['trigger_chance']),
                    redirectTarget:     cellStr(r['redirect_target']),
                    biasWeight:         cellNum(r['bias_weight']),
                    restrictActionType: cellStr(r['restrict_action_type']),
                    restrictIsBlock:    cellBool(r['restrict_is_block']),
                });
            });
        }
    }

    return result;
}
