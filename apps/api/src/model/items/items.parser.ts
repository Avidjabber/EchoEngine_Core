import ExcelJS from 'exceljs';

export interface ItemRow {
    row:             number;
    codeName:        string | null;
    name:            string | null;
    description:     string | null;
    types:           string | null;
    measurementType: string | null;
    averageWeight:   number | null;
    weightVariance:  number | null;
    averageVolume:   number | null;
    rotCap:          number | null;
    maxDurability:   number | null;
    maxUses:         number | null;
    maxDailyUses:    number | null;
    fuelValue:       number | null;
    fuelType:        string | null;
    isEphemeral:     boolean | null;
}

export interface ItemEquipmentRow {
    row:                   number;
    itemCodeName:          string | null;
    slotType:              string | null;
    slotCost:              number | null;
    label:                 string | null;
    acModifier:            number | null;
    damageDiceCount:       number | null;
    damageDiceSides:       number | null;
    damageType:            string | null;
    elementalDiceCount:    number | null;
    elementalDiceSides:    number | null;
    elementalDamageType:   string | null;
    healDiceCount:         number | null;
    healDiceSides:         number | null;
    isMagical:             boolean | null;
    actionCategory:        string | null;
    actionType:            string | null;
    targetScope:           string | null;
    cooldownRounds:        number | null;
    durationRounds:        number | null;
    behaviorEffectType:    string | null;
    flatModifier:          number | null;
    percentModifier:       number | null;
    isReactionAction:      boolean | null;
    requiresVerbal:        boolean | null;
    requiresSomatic:       boolean | null;
    allowedInSpar:         boolean | null;
    usageContext:          string | null;
    hitStat:               string | null;
    damageStat:            string | null;
    healStat:              string | null;
    hitBonus:              number | null;
    damageBonus:           number | null;
    healBonus:             number | null;
    savingThrowStat:       string | null;
    saveDC:                number | null;
    triggersEventDef:      string | null;
    triggerDC:             number | null;
    outOfCombatMaxTargets: number | null;
    summonSpecies:         string | null;
    summonDiceCount:       number | null;
    summonDiceSides:       number | null;
    attackCount:           number | null;
}

export interface ItemFoodRow {
    row:                   number;
    itemCodeName:          string | null;
    meatNutritionPerGram:  number | null;
    meatHydrationPerGram:  number | null;
    plantNutritionPerGram: number | null;
    plantHydrationPerGram: number | null;
}

export interface ItemActionRow {
    row:           number;
    itemCodeName:  string | null;
    interaction:   string | null;
    energyCost:    number | null;
    consumedOnUse: boolean | null;
}

export interface ItemEffectRow {
    row:           number;
    itemCodeName:  string | null;
    interaction:   string | null;
    symptom:       string | null;
    relationType:  string | null;
    effectiveness: number | null;
}

export interface ParsedItemPack {
    items:     ItemRow[];
    equipment: ItemEquipmentRow[];
    food:      ItemFoodRow[];
    actions:   ItemActionRow[];
    effects:   ItemEffectRow[];
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

export async function parseItemPack(buffer: Buffer): Promise<ParsedItemPack> {
    const result: ParsedItemPack = { items: [], equipment: [], food: [], actions: [], effects: [] };

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    for (const worksheet of workbook.worksheets) {
        const sheetName = worksheet.name.toLowerCase().replace(/\s+/g, '_');

        if (sheetName === 'items') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.items.push({
                    row:             rowIndex,
                    codeName:        cellStr(r['code_name']),
                    name:            cellStr(r['name']),
                    description:     cellStr(r['description']),
                    types:           cellStr(r['types']),
                    measurementType: cellStr(r['measurement_type']),
                    averageWeight:   cellNum(r['average_weight']),
                    weightVariance:  cellNum(r['weight_variance']),
                    averageVolume:   cellNum(r['average_volume']),
                    rotCap:          cellNum(r['rot_cap']),
                    maxDurability:   cellNum(r['max_durability']),
                    maxUses:         cellNum(r['max_uses']),
                    maxDailyUses:    cellNum(r['max_daily_uses']),
                    fuelValue:       cellNum(r['fuel_value']),
                    fuelType:        cellStr(r['fuel_type']),
                    isEphemeral:     cellBool(r['is_ephemeral']),
                });
            });
        }

        if (sheetName === 'equipment') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.equipment.push({
                    row:                   rowIndex,
                    itemCodeName:          cellStr(r['item_code_name']),
                    slotType:              cellStr(r['slot_type']),
                    slotCost:              cellNum(r['slot_cost']),
                    label:                 cellStr(r['label']),
                    acModifier:            cellNum(r['ac_modifier']),
                    damageDiceCount:       cellNum(r['damage_dice_count']),
                    damageDiceSides:       cellNum(r['damage_dice_sides']),
                    damageType:            cellStr(r['damage_type']),
                    elementalDiceCount:    cellNum(r['elemental_dice_count']),
                    elementalDiceSides:    cellNum(r['elemental_dice_sides']),
                    elementalDamageType:   cellStr(r['elemental_damage_type']),
                    healDiceCount:         cellNum(r['heal_dice_count']),
                    healDiceSides:         cellNum(r['heal_dice_sides']),
                    isMagical:             cellBool(r['is_magical']),
                    actionCategory:        cellStr(r['action_category']),
                    actionType:            cellStr(r['action_type']),
                    targetScope:           cellStr(r['target_scope']),
                    cooldownRounds:        cellNum(r['cooldown_rounds']),
                    durationRounds:        cellNum(r['duration_rounds']),
                    behaviorEffectType:    cellStr(r['behavior_effect_type']),
                    flatModifier:          cellNum(r['flat_modifier']),
                    percentModifier:       cellNum(r['percent_modifier']),
                    isReactionAction:      cellBool(r['is_reaction_action']),
                    requiresVerbal:        cellBool(r['requires_verbal']),
                    requiresSomatic:       cellBool(r['requires_somatic']),
                    allowedInSpar:         cellBool(r['allowed_in_spar']),
                    usageContext:          cellStr(r['usage_context']),
                    hitStat:               cellStr(r['hit_stat']),
                    damageStat:            cellStr(r['damage_stat']),
                    healStat:              cellStr(r['heal_stat']),
                    hitBonus:              cellNum(r['hit_bonus']),
                    damageBonus:           cellNum(r['damage_bonus']),
                    healBonus:             cellNum(r['heal_bonus']),
                    savingThrowStat:       cellStr(r['saving_throw_stat']),
                    saveDC:                cellNum(r['save_dc']),
                    triggersEventDef:      cellStr(r['triggers_event_def']),
                    triggerDC:             cellNum(r['trigger_dc']),
                    outOfCombatMaxTargets: cellNum(r['out_of_combat_max_targets']),
                    summonSpecies:         cellStr(r['summon_species']),
                    summonDiceCount:       cellNum(r['summon_dice_count']),
                    summonDiceSides:       cellNum(r['summon_dice_sides']),
                    attackCount:           cellNum(r['attack_count']),
                });
            });
        }

        if (sheetName === 'food') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.food.push({
                    row:                   rowIndex,
                    itemCodeName:          cellStr(r['item_code_name']),
                    meatNutritionPerGram:  cellNum(r['meat_nutrition_per_gram']),
                    meatHydrationPerGram:  cellNum(r['meat_hydration_per_gram']),
                    plantNutritionPerGram: cellNum(r['plant_nutrition_per_gram']),
                    plantHydrationPerGram: cellNum(r['plant_hydration_per_gram']),
                });
            });
        }

        if (sheetName === 'actions') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.actions.push({
                    row:           rowIndex,
                    itemCodeName:  cellStr(r['item_code_name']),
                    interaction:   cellStr(r['interaction']),
                    energyCost:    cellNum(r['energy_cost']),
                    consumedOnUse: cellBool(r['consumed_on_use']),
                });
            });
        }

        if (sheetName === 'effects') {
            let headerMap: Record<number, string> = {};
            worksheet.eachRow((row, rowIndex) => {
                const vals = row.values as CellValue[];
                if (rowIndex === 1) { headerMap = buildHeaderMap(vals); return; }
                const r = rowToRecord(vals, headerMap);
                if (isEmptyRow(r)) return;
                result.effects.push({
                    row:           rowIndex,
                    itemCodeName:  cellStr(r['item_code_name']),
                    interaction:   cellStr(r['interaction']),
                    symptom:       cellStr(r['symptom']),
                    relationType:  cellStr(r['relation_type']),
                    effectiveness: cellNum(r['effectiveness']),
                });
            });
        }
    }

    return result;
}
