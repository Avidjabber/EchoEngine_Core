import ExcelJS from 'exceljs';
import type { ItemTemplateData, ItemDownloadData } from '../../services/model/itemPackService';

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
    const maxRows = Math.max(...columns.map(c => c.values.length));
    for (let i = 0; i < maxRows; i++) {
        const rowData: Record<string, string> = {};
        for (const col of columns) rowData[col.header] = col.values[i] ?? '';
        sheet.addRow(rowData);
    }
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function generateItemTemplate(data: ItemTemplateData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // ── items tab ──────────────────────────────────────────────────────────────
    const itemsSheet = workbook.addWorksheet('items');
    itemsSheet.columns = [
        { header: 'code_name',        key: 'code_name',        width: 28 },
        { header: 'name',             key: 'name',             width: 24 },
        { header: 'description',      key: 'description',      width: 40 },
        { header: 'types',            key: 'types',            width: 30 },
        { header: 'measurement_type', key: 'measurement_type', width: 20 },
        { header: 'average_weight',   key: 'average_weight',   width: 16 },
        { header: 'weight_variance',  key: 'weight_variance',  width: 16 },
        { header: 'average_volume',   key: 'average_volume',   width: 16 },
        { header: 'rot_cap',          key: 'rot_cap',          width: 12 },
        { header: 'max_durability',   key: 'max_durability',   width: 14 },
        { header: 'max_uses',         key: 'max_uses',         width: 12 },
        { header: 'max_daily_uses',   key: 'max_daily_uses',   width: 14 },
        { header: 'fuel_value',       key: 'fuel_value',       width: 12 },
        { header: 'fuel_type',        key: 'fuel_type',        width: 18 },
        { header: 'is_ephemeral',     key: 'is_ephemeral',     width: 14 },
    ];
    styleHeaderRow(itemsSheet.getRow(1));
    itemsSheet.getRow(1).getCell('code_name').note  = 'snake_case slug, unique per guild. Permanent identifier — changing it creates a new item.';
    itemsSheet.getRow(1).getCell('types').note       = 'Comma-separated item type names. See reference tab.';
    itemsSheet.getRow(1).getCell('measurement_type').note = 'Count, Weight, or Volume. See reference tab.';
    itemsSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ── equipment tab ──────────────────────────────────────────────────────────
    const equipSheet = workbook.addWorksheet('equipment');
    equipSheet.columns = [
        { header: 'item_code_name',          key: 'item_code_name',          width: 28 },
        { header: 'slot_type',               key: 'slot_type',               width: 20 },
        { header: 'slot_cost',               key: 'slot_cost',               width: 10 },
        { header: 'label',                   key: 'label',                   width: 20 },
        { header: 'ac_modifier',             key: 'ac_modifier',             width: 12 },
        { header: 'damage_dice_count',       key: 'damage_dice_count',       width: 18 },
        { header: 'damage_dice_sides',       key: 'damage_dice_sides',       width: 18 },
        { header: 'damage_type',             key: 'damage_type',             width: 18 },
        { header: 'elemental_dice_count',    key: 'elemental_dice_count',    width: 20 },
        { header: 'elemental_dice_sides',    key: 'elemental_dice_sides',    width: 20 },
        { header: 'elemental_damage_type',   key: 'elemental_damage_type',   width: 22 },
        { header: 'heal_dice_count',         key: 'heal_dice_count',         width: 16 },
        { header: 'heal_dice_sides',         key: 'heal_dice_sides',         width: 16 },
        { header: 'is_magical',              key: 'is_magical',              width: 12 },
        { header: 'action_category',         key: 'action_category',         width: 20 },
        { header: 'action_type',             key: 'action_type',             width: 20 },
        { header: 'target_scope',            key: 'target_scope',            width: 16 },
        { header: 'cooldown_rounds',         key: 'cooldown_rounds',         width: 16 },
        { header: 'duration_rounds',         key: 'duration_rounds',         width: 16 },
        { header: 'behavior_effect_type',    key: 'behavior_effect_type',    width: 22 },
        { header: 'flat_modifier',           key: 'flat_modifier',           width: 14 },
        { header: 'percent_modifier',        key: 'percent_modifier',        width: 16 },
        { header: 'is_reaction_action',      key: 'is_reaction_action',      width: 18 },
        { header: 'requires_verbal',         key: 'requires_verbal',         width: 16 },
        { header: 'requires_somatic',        key: 'requires_somatic',        width: 16 },
        { header: 'allowed_in_spar',         key: 'allowed_in_spar',         width: 14 },
        { header: 'usage_context',           key: 'usage_context',           width: 18 },
        { header: 'hit_stat',                key: 'hit_stat',                width: 14 },
        { header: 'damage_stat',             key: 'damage_stat',             width: 14 },
        { header: 'heal_stat',               key: 'heal_stat',               width: 14 },
        { header: 'hit_bonus',               key: 'hit_bonus',               width: 12 },
        { header: 'damage_bonus',            key: 'damage_bonus',            width: 14 },
        { header: 'heal_bonus',              key: 'heal_bonus',              width: 12 },
        { header: 'saving_throw_stat',       key: 'saving_throw_stat',       width: 18 },
        { header: 'save_dc',                 key: 'save_dc',                 width: 10 },
        { header: 'triggers_event_def',      key: 'triggers_event_def',      width: 22 },
        { header: 'trigger_dc',              key: 'trigger_dc',              width: 12 },
        { header: 'out_of_combat_max_targets', key: 'out_of_combat_max_targets', width: 24 },
        { header: 'summon_species',          key: 'summon_species',          width: 20 },
        { header: 'summon_dice_count',       key: 'summon_dice_count',       width: 18 },
        { header: 'summon_dice_sides',       key: 'summon_dice_sides',       width: 18 },
        { header: 'attack_count',            key: 'attack_count',            width: 14 },
    ];
    styleHeaderRow(equipSheet.getRow(1));
    equipSheet.getRow(1).getCell('item_code_name').note = 'Must match a code_name in the items tab.';
    equipSheet.getRow(1).getCell('slot_type').note      = 'See reference tab for valid slot types.';
    equipSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ── food tab ───────────────────────────────────────────────────────────────
    const foodSheet = workbook.addWorksheet('food');
    foodSheet.columns = [
        { header: 'item_code_name',           key: 'item_code_name',           width: 28 },
        { header: 'meat_nutrition_per_gram',   key: 'meat_nutrition_per_gram',   width: 24 },
        { header: 'meat_hydration_per_gram',   key: 'meat_hydration_per_gram',   width: 24 },
        { header: 'plant_nutrition_per_gram',  key: 'plant_nutrition_per_gram',  width: 26 },
        { header: 'plant_hydration_per_gram',  key: 'plant_hydration_per_gram',  width: 26 },
    ];
    styleHeaderRow(foodSheet.getRow(1));
    foodSheet.getRow(1).getCell('item_code_name').note = 'Must match a code_name in the items tab. One row per item.';
    foodSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ── actions tab ────────────────────────────────────────────────────────────
    const actionsSheet = workbook.addWorksheet('actions');
    actionsSheet.columns = [
        { header: 'item_code_name',  key: 'item_code_name',  width: 28 },
        { header: 'interaction',     key: 'interaction',     width: 20 },
        { header: 'energy_cost',     key: 'energy_cost',     width: 14 },
        { header: 'consumed_on_use', key: 'consumed_on_use', width: 16 },
    ];
    styleHeaderRow(actionsSheet.getRow(1));
    actionsSheet.getRow(1).getCell('item_code_name').note = 'Must match a code_name in the items tab.';
    actionsSheet.getRow(1).getCell('interaction').note    = 'See reference tab for valid interaction types.';
    actionsSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ── effects tab ────────────────────────────────────────────────────────────
    const effectsSheet = workbook.addWorksheet('effects');
    effectsSheet.columns = [
        { header: 'item_code_name',  key: 'item_code_name',  width: 28 },
        { header: 'interaction',     key: 'interaction',     width: 20 },
        { header: 'symptom',         key: 'symptom',         width: 28 },
        { header: 'relation_type',   key: 'relation_type',   width: 18 },
        { header: 'effectiveness',   key: 'effectiveness',   width: 14 },
    ];
    styleHeaderRow(effectsSheet.getRow(1));
    effectsSheet.getRow(1).getCell('item_code_name').note = 'Must match a code_name in the items tab.';
    effectsSheet.getRow(1).getCell('interaction').note    = 'Must match an interaction in the actions tab for this item.';
    effectsSheet.getRow(1).getCell('symptom').note        = 'See reference tab for valid symptoms.';
    effectsSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ── reference tab ──────────────────────────────────────────────────────────
    const refSheet = workbook.addWorksheet('reference');
    addRefColumns(refSheet, [
        { header: 'Item Types',           values: data.itemTypes },
        { header: 'Measurement Types',    values: data.measurementTypes },
        { header: 'Fuel Types',           values: data.fuelTypes },
        { header: 'Slot Types',           values: data.slotTypes },
        { header: 'Damage Types',         values: data.damageTypes },
        { header: 'Stats',                values: data.stats },
        { header: 'Action Categories',    values: data.actionCategories },
        { header: 'Item Action Types',    values: data.itemActionTypes },
        { header: 'Target Scopes',        values: data.targetScopes },
        { header: 'Behavior Effects',     values: data.behaviorEffectTypes },
        { header: 'Item Interactions',    values: data.itemInteractions },
        { header: 'Symptoms',             values: data.symptoms },
        { header: 'Relation Types',       values: data.relationTypes },
        { header: 'Species (codeName)',   values: data.speciesCodes },
        { header: 'Event Defs (codeName)', values: data.eventDefCodes },
        { header: 'Existing Items',       values: data.existingItems },
    ]);

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}

export async function generateItemDownload(data: ItemDownloadData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const itemsSheet = workbook.addWorksheet('items');
    itemsSheet.columns = [
        { header: 'code_name',        key: 'code_name',        width: 28 },
        { header: 'name',             key: 'name',             width: 24 },
        { header: 'description',      key: 'description',      width: 40 },
        { header: 'types',            key: 'types',            width: 30 },
        { header: 'measurement_type', key: 'measurement_type', width: 20 },
        { header: 'average_weight',   key: 'average_weight',   width: 16 },
        { header: 'weight_variance',  key: 'weight_variance',  width: 16 },
        { header: 'average_volume',   key: 'average_volume',   width: 16 },
        { header: 'rot_cap',          key: 'rot_cap',          width: 12 },
        { header: 'max_durability',   key: 'max_durability',   width: 14 },
        { header: 'max_uses',         key: 'max_uses',         width: 12 },
        { header: 'max_daily_uses',   key: 'max_daily_uses',   width: 14 },
        { header: 'fuel_value',       key: 'fuel_value',       width: 12 },
        { header: 'fuel_type',        key: 'fuel_type',        width: 18 },
        { header: 'is_ephemeral',     key: 'is_ephemeral',     width: 14 },
    ];
    styleHeaderRow(itemsSheet.getRow(1));
    itemsSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const item of data.items) {
        itemsSheet.addRow({
            code_name:        item.codeName,
            name:             item.name,
            description:      item.description ?? '',
            types:            item.types,
            measurement_type: item.measurementType ?? '',
            average_weight:   item.averageWeight,
            weight_variance:  item.weightVariance,
            average_volume:   item.averageVolume,
            rot_cap:          item.rotCap ?? '',
            max_durability:   item.maxDurability ?? '',
            max_uses:         item.maxUses ?? '',
            max_daily_uses:   item.maxDailyUses ?? '',
            fuel_value:       item.fuelValue ?? '',
            fuel_type:        item.fuelType ?? '',
            is_ephemeral:     item.isEphemeral,
        });
    }

    const equipSheet = workbook.addWorksheet('equipment');
    equipSheet.columns = [
        { header: 'item_code_name',            key: 'item_code_name',            width: 28 },
        { header: 'slot_type',                 key: 'slot_type',                 width: 20 },
        { header: 'slot_cost',                 key: 'slot_cost',                 width: 10 },
        { header: 'label',                     key: 'label',                     width: 20 },
        { header: 'ac_modifier',               key: 'ac_modifier',               width: 12 },
        { header: 'damage_dice_count',         key: 'damage_dice_count',         width: 18 },
        { header: 'damage_dice_sides',         key: 'damage_dice_sides',         width: 18 },
        { header: 'damage_type',               key: 'damage_type',               width: 18 },
        { header: 'elemental_dice_count',      key: 'elemental_dice_count',      width: 20 },
        { header: 'elemental_dice_sides',      key: 'elemental_dice_sides',      width: 20 },
        { header: 'elemental_damage_type',     key: 'elemental_damage_type',     width: 22 },
        { header: 'heal_dice_count',           key: 'heal_dice_count',           width: 16 },
        { header: 'heal_dice_sides',           key: 'heal_dice_sides',           width: 16 },
        { header: 'is_magical',                key: 'is_magical',                width: 12 },
        { header: 'action_category',           key: 'action_category',           width: 20 },
        { header: 'action_type',               key: 'action_type',               width: 20 },
        { header: 'target_scope',              key: 'target_scope',              width: 16 },
        { header: 'cooldown_rounds',           key: 'cooldown_rounds',           width: 16 },
        { header: 'duration_rounds',           key: 'duration_rounds',           width: 16 },
        { header: 'behavior_effect_type',      key: 'behavior_effect_type',      width: 22 },
        { header: 'flat_modifier',             key: 'flat_modifier',             width: 14 },
        { header: 'percent_modifier',          key: 'percent_modifier',          width: 16 },
        { header: 'is_reaction_action',        key: 'is_reaction_action',        width: 18 },
        { header: 'requires_verbal',           key: 'requires_verbal',           width: 16 },
        { header: 'requires_somatic',          key: 'requires_somatic',          width: 16 },
        { header: 'allowed_in_spar',           key: 'allowed_in_spar',           width: 14 },
        { header: 'usage_context',             key: 'usage_context',             width: 18 },
        { header: 'hit_stat',                  key: 'hit_stat',                  width: 14 },
        { header: 'damage_stat',               key: 'damage_stat',               width: 14 },
        { header: 'heal_stat',                 key: 'heal_stat',                 width: 14 },
        { header: 'hit_bonus',                 key: 'hit_bonus',                 width: 12 },
        { header: 'damage_bonus',              key: 'damage_bonus',              width: 14 },
        { header: 'heal_bonus',                key: 'heal_bonus',                width: 12 },
        { header: 'saving_throw_stat',         key: 'saving_throw_stat',         width: 18 },
        { header: 'save_dc',                   key: 'save_dc',                   width: 10 },
        { header: 'triggers_event_def',        key: 'triggers_event_def',        width: 22 },
        { header: 'trigger_dc',                key: 'trigger_dc',                width: 12 },
        { header: 'out_of_combat_max_targets', key: 'out_of_combat_max_targets', width: 24 },
        { header: 'summon_species',            key: 'summon_species',            width: 20 },
        { header: 'summon_dice_count',         key: 'summon_dice_count',         width: 18 },
        { header: 'summon_dice_sides',         key: 'summon_dice_sides',         width: 18 },
        { header: 'attack_count',              key: 'attack_count',              width: 14 },
    ];
    styleHeaderRow(equipSheet.getRow(1));
    equipSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const e of data.equipment) {
        equipSheet.addRow({
            item_code_name:            e.itemCodeName,
            slot_type:                 e.slotType,
            slot_cost:                 e.slotCost,
            label:                     e.label ?? '',
            ac_modifier:               e.acModifier,
            damage_dice_count:         e.damageDiceCount ?? '',
            damage_dice_sides:         e.damageDiceSides ?? '',
            damage_type:               e.damageType ?? '',
            elemental_dice_count:      e.elementalDiceCount ?? '',
            elemental_dice_sides:      e.elementalDiceSides ?? '',
            elemental_damage_type:     e.elementalDamageType ?? '',
            heal_dice_count:           e.healDiceCount ?? '',
            heal_dice_sides:           e.healDiceSides ?? '',
            is_magical:                e.isMagical,
            action_category:           e.actionCategory ?? '',
            action_type:               e.actionType ?? '',
            target_scope:              e.targetScope ?? '',
            cooldown_rounds:           e.cooldownRounds,
            duration_rounds:           e.durationRounds,
            behavior_effect_type:      e.behaviorEffectType ?? '',
            flat_modifier:             e.flatModifier ?? '',
            percent_modifier:          e.percentModifier ?? '',
            is_reaction_action:        e.isReactionAction,
            requires_verbal:           e.requiresVerbal,
            requires_somatic:          e.requiresSomatic,
            allowed_in_spar:           e.allowedInSpar,
            usage_context:             e.usageContext,
            hit_stat:                  e.hitStat ?? '',
            damage_stat:               e.damageStat ?? '',
            heal_stat:                 e.healStat ?? '',
            hit_bonus:                 e.hitBonus,
            damage_bonus:              e.damageBonus,
            heal_bonus:                e.healBonus,
            saving_throw_stat:         e.savingThrowStat ?? '',
            save_dc:                   e.saveDC,
            triggers_event_def:        e.triggersEventDef ?? '',
            trigger_dc:                e.triggerDC,
            out_of_combat_max_targets: e.outOfCombatMaxTargets ?? '',
            summon_species:            e.summonSpecies ?? '',
            summon_dice_count:         e.summonDiceCount ?? '',
            summon_dice_sides:         e.summonDiceSides ?? '',
            attack_count:              e.attackCount,
        });
    }

    const foodSheet = workbook.addWorksheet('food');
    foodSheet.columns = [
        { header: 'item_code_name',           key: 'item_code_name',           width: 28 },
        { header: 'meat_nutrition_per_gram',   key: 'meat_nutrition_per_gram',   width: 24 },
        { header: 'meat_hydration_per_gram',   key: 'meat_hydration_per_gram',   width: 24 },
        { header: 'plant_nutrition_per_gram',  key: 'plant_nutrition_per_gram',  width: 26 },
        { header: 'plant_hydration_per_gram',  key: 'plant_hydration_per_gram',  width: 26 },
    ];
    styleHeaderRow(foodSheet.getRow(1));
    foodSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const f of data.food) {
        foodSheet.addRow({
            item_code_name:            f.itemCodeName,
            meat_nutrition_per_gram:   f.meatNutritionPerGram,
            meat_hydration_per_gram:   f.meatHydrationPerGram,
            plant_nutrition_per_gram:  f.plantNutritionPerGram,
            plant_hydration_per_gram:  f.plantHydrationPerGram,
        });
    }

    const actionsSheet = workbook.addWorksheet('actions');
    actionsSheet.columns = [
        { header: 'item_code_name',  key: 'item_code_name',  width: 28 },
        { header: 'interaction',     key: 'interaction',     width: 20 },
        { header: 'energy_cost',     key: 'energy_cost',     width: 14 },
        { header: 'consumed_on_use', key: 'consumed_on_use', width: 16 },
    ];
    styleHeaderRow(actionsSheet.getRow(1));
    actionsSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const a of data.actions) {
        actionsSheet.addRow({
            item_code_name:  a.itemCodeName,
            interaction:     a.interaction,
            energy_cost:     a.energyCost,
            consumed_on_use: a.consumedOnUse,
        });
    }

    const effectsSheet = workbook.addWorksheet('effects');
    effectsSheet.columns = [
        { header: 'item_code_name',  key: 'item_code_name',  width: 28 },
        { header: 'interaction',     key: 'interaction',     width: 20 },
        { header: 'symptom',         key: 'symptom',         width: 28 },
        { header: 'relation_type',   key: 'relation_type',   width: 18 },
        { header: 'effectiveness',   key: 'effectiveness',   width: 14 },
    ];
    styleHeaderRow(effectsSheet.getRow(1));
    effectsSheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const e of data.effects) {
        effectsSheet.addRow({
            item_code_name:  e.itemCodeName,
            interaction:     e.interaction,
            symptom:         e.symptom,
            relation_type:   e.relationType,
            effectiveness:   e.effectiveness,
        });
    }

    const refSheet = workbook.addWorksheet('reference');
    addRefColumns(refSheet, [
        { header: 'Item Types',            values: data.templateData.itemTypes },
        { header: 'Measurement Types',     values: data.templateData.measurementTypes },
        { header: 'Fuel Types',            values: data.templateData.fuelTypes },
        { header: 'Slot Types',            values: data.templateData.slotTypes },
        { header: 'Damage Types',          values: data.templateData.damageTypes },
        { header: 'Stats',                 values: data.templateData.stats },
        { header: 'Action Categories',     values: data.templateData.actionCategories },
        { header: 'Item Action Types',     values: data.templateData.itemActionTypes },
        { header: 'Target Scopes',         values: data.templateData.targetScopes },
        { header: 'Behavior Effects',      values: data.templateData.behaviorEffectTypes },
        { header: 'Item Interactions',     values: data.templateData.itemInteractions },
        { header: 'Symptoms',              values: data.templateData.symptoms },
        { header: 'Relation Types',        values: data.templateData.relationTypes },
        { header: 'Species (codeName)',    values: data.templateData.speciesCodes },
        { header: 'Event Defs (codeName)', values: data.templateData.eventDefCodes },
        { header: 'Existing Items',        values: data.templateData.existingItems },
    ]);

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
}
