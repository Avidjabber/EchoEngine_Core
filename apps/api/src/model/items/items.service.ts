import { Injectable } from '@nestjs/common';
import {
    ItemRowDto,
    ItemEquipmentRowDto,
    ItemActionRowDto,
    ItemEffectRowDto,
    UploadItemPackDto,
    UploadItemPackResult,
    ItemTemplateData,
    ResetItemPackResult,
    ItemSavedRow,
    ItemOverwrittenRow,
    RowError,
} from './dto/upload-item-pack.dto';
import { ItemsRepository } from './items.repository';
import { validateName, validateCodeName, validateDescription } from '../../utils/contentFilter';

function rowInput(...parts: (string | number | null | undefined)[]): string {
    return parts.map(p => (p === null || p === undefined) ? '?' : String(p)).join(' | ');
}

interface EquipmentCandidate {
    dto:                  ItemEquipmentRowDto;
    slotTypeId:           number;
    slotCost:             number;
    label:                string | null;
    acModifier:           number;
    damageDiceCount:      number | null;
    damageDiceSides:      number | null;
    damageTypeId:         number | null;
    elementalDiceCount:   number | null;
    elementalDiceSides:   number | null;
    elementalDamageTypeId: number | null;
    healDiceCount:        number | null;
    healDiceSides:        number | null;
    isMagical:            boolean;
    actionCategoryId:     number | null;
    actionTypeId:         number | null;
    targetScopeId:        number | null;
    cooldownRounds:       number;
    durationRounds:       number;
    behaviorEffectTypeId: number | null;
    flatModifier:         number | null;
    percentModifier:      number | null;
    isReactionAction:     boolean;
    requiresVerbal:       boolean;
    requiresSomatic:      boolean;
    allowedInSpar:        boolean;
    usageContext:         string | null;
    hitStatId:            number | null;
    damageStatId:         number | null;
    healStatId:           number | null;
    hitBonus:             number;
    damageBonus:          number;
    healBonus:            number;
    savingThrowStatId:    number | null;
    saveDC:               number | null;
    triggersEventDefId:   number | null;
    triggerDC:            number | null;
    outOfCombatMaxTargets: number | null;
    summonSpeciesId:      number | null;
    summonDiceCount:      number | null;
    summonDiceSides:      number | null;
    attackCount:          number | null;
}

interface ActionCandidate {
    itemInteractionId: number;
    energyCost:        number;
    consumedOnUse:     boolean;
    effects: Array<{
        symptomId:      number;
        relationTypeId: number;
        effectiveness:  number | null;
    }>;
}

interface ItemCandidate {
    dto:             ItemRowDto;
    codeName:        string;
    name:            string;
    description:     string | null;
    typeIds:         number[];
    measurementTypeId: number | null;
    averageWeight:   number;
    weightVariance:  number;
    averageVolume:   number;
    rotCap:          number | null;
    maxDurability:   number | null;
    maxUses:         number | null;
    maxDailyUses:    number | null;
    fuelValue:       number | null;
    fuelTypeId:      number | null;
    isEphemeral:     boolean;
    equipmentProfiles: EquipmentCandidate[];
    foodProfile:     { meatNutritionPerGram: number; meatHydrationPerGram: number; plantNutritionPerGram: number; plantHydrationPerGram: number } | null;
    actions:         ActionCandidate[];
    existing:        { id: number; codeName: string; name: string } | undefined;
}

@Injectable()
export class ItemsService {
    constructor(private readonly repo: ItemsRepository) {}

    async getTemplateData(guildId: string): Promise<ItemTemplateData> {
        const [
            measurementTypes, fuelTypes, itemTypes, slotTypes, damageTypes,
            stats, actionCategories, itemActionTypes, targetScopes, behaviorEffectTypes,
            itemInteractions, symptoms, relationTypes, speciesCodes, eventDefCodes, existingItems,
        ] = await Promise.all([
            this.repo.findAllMeasurementTypes(),
            this.repo.findAllFuelTypes(),
            this.repo.findAllItemTypes(),
            this.repo.findAllEquipmentSlotTypes(),
            this.repo.findAllDamageTypes(),
            this.repo.findAllStats(),
            this.repo.findAllCombatActionCategories(),
            this.repo.findAllItemActionTypes(),
            this.repo.findAllCombatTargetScopes(),
            this.repo.findAllCombatEffectTypes(),
            this.repo.findAllItemInteractions(),
            this.repo.findAllSymptoms(),
            this.repo.findItemRelationTypes(),
            this.repo.findGuildSpeciesCodes(guildId),
            this.repo.findGuildEventDefCodes(guildId),
            this.repo.findGuildItems(guildId),
        ]);

        return {
            measurementTypes:    measurementTypes.map(x => x.name),
            fuelTypes:           fuelTypes.map(x => x.name),
            itemTypes:           itemTypes.map(x => x.name),
            slotTypes:           slotTypes.map(x => x.name),
            damageTypes:         damageTypes.map(x => x.name),
            stats:               stats.map(x => x.name),
            actionCategories:    actionCategories.map(x => x.name),
            itemActionTypes:     itemActionTypes.map(x => x.name),
            targetScopes:        targetScopes.map(x => x.name),
            behaviorEffectTypes: behaviorEffectTypes.map(x => x.name),
            itemInteractions:    itemInteractions.map(x => x.name),
            symptoms:            symptoms.map(x => x.name),
            relationTypes:       relationTypes.map(x => x.name),
            speciesCodes:        speciesCodes.map(x => x.codeName),
            eventDefCodes:       eventDefCodes.map(x => x.codeName),
            existingItems:       existingItems.map(x => x.codeName),
        };
    }

    async resetPack(guildId: string): Promise<ResetItemPackResult> {
        const items = await this.repo.findGuildItems(guildId);

        const deleted: ResetItemPackResult['deleted'] = [];
        const failed:  ResetItemPackResult['failed']  = [];

        const results = await Promise.allSettled(items.map(i => this.repo.deleteItemById(i.id)));

        results.forEach((result, i) => {
            const item = items[i];
            if (result.status === 'fulfilled') {
                deleted.push({ codeName: item.codeName, name: item.name });
            } else {
                failed.push({ codeName: item.codeName, name: item.name, reason: 'Still in use — cannot be removed' });
            }
        });

        return { deleted, failed };
    }

    async uploadPack(dto: UploadItemPackDto): Promise<UploadItemPackResult> {
        const [
            measurementTypes, fuelTypes, itemTypes, slotTypes, damageTypes,
            stats, actionCategories, itemActionTypes, targetScopes, behaviorEffectTypes,
            itemInteractions, symptoms, relationTypes, speciesCodes, eventDefCodes, existingItems,
        ] = await Promise.all([
            this.repo.findAllMeasurementTypes(),
            this.repo.findAllFuelTypes(),
            this.repo.findAllItemTypes(),
            this.repo.findAllEquipmentSlotTypes(),
            this.repo.findAllDamageTypes(),
            this.repo.findAllStats(),
            this.repo.findAllCombatActionCategories(),
            this.repo.findAllItemActionTypes(),
            this.repo.findAllCombatTargetScopes(),
            this.repo.findAllCombatEffectTypes(),
            this.repo.findAllItemInteractions(),
            this.repo.findAllSymptoms(),
            this.repo.findItemRelationTypes(),
            this.repo.findGuildSpeciesCodes(dto.guildId),
            this.repo.findGuildEventDefCodes(dto.guildId),
            this.repo.findGuildItems(dto.guildId),
        ]);

        const measurementTypeMap  = new Map(measurementTypes.map(x  => [x.name.toLowerCase(),   x]));
        const fuelTypeMap         = new Map(fuelTypes.map(x         => [x.name.toLowerCase(),   x]));
        const itemTypeMap         = new Map(itemTypes.map(x         => [x.name.toLowerCase(),   x]));
        const slotTypeMap         = new Map(slotTypes.map(x         => [x.name.toLowerCase(),   x]));
        const damageTypeMap       = new Map(damageTypes.map(x       => [x.name.toLowerCase(),   x]));
        const statMap             = new Map(stats.map(x             => [x.name.toLowerCase(),   x]));
        const actionCategoryMap   = new Map(actionCategories.map(x  => [x.name.toLowerCase(),   x]));
        const itemActionTypeMap   = new Map(itemActionTypes.map(x   => [x.name.toLowerCase(),   x]));
        const targetScopeMap      = new Map(targetScopes.map(x      => [x.name.toLowerCase(),   x]));
        const behaviorEffectMap   = new Map(behaviorEffectTypes.map(x => [x.name.toLowerCase(), x]));
        const itemInteractionMap  = new Map(itemInteractions.map(x  => [x.name.toLowerCase(),   x]));
        const symptomMap          = new Map(symptoms.map(x          => [x.name.toLowerCase(),   x]));
        const relationTypeMap     = new Map(relationTypes.map(x     => [x.name.toLowerCase(),   x]));
        const speciesMap          = new Map(speciesCodes.map(x      => [x.codeName.toLowerCase(), x]));
        const eventDefMap         = new Map(eventDefCodes.map(x     => [x.codeName.toLowerCase(), x]));
        const existingMap         = new Map(existingItems.map(x     => [x.codeName.toLowerCase(), x]));

        // ── Index sub-rows by itemCodeName ─────────────────────────────────────
        const equipByItem  = new Map<string, { rows: ItemEquipmentRowDto[]; errors: RowError[] }>();
        const foodByItem   = new Map<string, { row: RowError | null; data: typeof dto.food[0] | null }>();
        const actionByItem = new Map<string, { rows: ItemActionRowDto[]; errors: RowError[] }>();
        const effectByActionKey = new Map<string, { rows: ItemEffectRowDto[]; errors: RowError[] }>();

        for (const row of dto.equipment) {
            const key = (row.itemCodeName ?? '').toLowerCase();
            if (!equipByItem.has(key)) equipByItem.set(key, { rows: [], errors: [] });
            equipByItem.get(key)!.rows.push(row);
        }

        for (const row of dto.food) {
            const key = (row.itemCodeName ?? '').toLowerCase();
            foodByItem.set(key, { row: null, data: row });
        }

        for (const row of dto.actions) {
            const key = (row.itemCodeName ?? '').toLowerCase();
            if (!actionByItem.has(key)) actionByItem.set(key, { rows: [], errors: [] });
            actionByItem.get(key)!.rows.push(row);
        }

        for (const row of dto.effects) {
            const key = `${(row.itemCodeName ?? '').toLowerCase()}::${(row.interaction ?? '').toLowerCase()}`;
            if (!effectByActionKey.has(key)) effectByActionKey.set(key, { rows: [], errors: [] });
            effectByActionKey.get(key)!.rows.push(row);
        }

        // ── Validate item rows ─────────────────────────────────────────────────
        const errors:     RowError[]      = [];
        const candidates: ItemCandidate[] = [];
        const seen = new Map<string, number>();

        for (const row of dto.items) {
            const input = rowInput(row.codeName, row.name);

            if (!row.codeName || !row.name) {
                const missing = ([
                    !row.codeName && 'code_name',
                    !row.name     && 'name',
                ] as (string | false)[]).filter(Boolean).join(', ');
                errors.push({ row: row.row, input, message: `Missing required field(s): ${missing}` });
                continue;
            }

            const codeNameCheck = validateCodeName(row.codeName);
            if (!codeNameCheck.valid) {
                errors.push({ row: row.row, input, message: `code_name ${codeNameCheck.reason}` });
                continue;
            }

            const nameCheck = validateName(row.name);
            if (!nameCheck.valid) {
                errors.push({ row: row.row, input, message: `name ${nameCheck.reason}` });
                continue;
            }

            let cleanDescription: string | null = null;
            if (row.description) {
                const descCheck = validateDescription(row.description);
                if (!descCheck.valid) {
                    errors.push({ row: row.row, input, message: `description ${descCheck.reason}` });
                    continue;
                }
                cleanDescription = descCheck.value;
            }

            const cleanCodeName = codeNameCheck.value;

            if (seen.has(cleanCodeName)) {
                errors.push({ row: row.row, input, message: `Duplicate of row ${seen.get(cleanCodeName)}` });
                continue;
            }
            seen.set(cleanCodeName, row.row);

            let measurementTypeId: number | null = null;
            if (row.measurementType) {
                const mt = measurementTypeMap.get(row.measurementType.toLowerCase());
                if (!mt) {
                    errors.push({ row: row.row, input, message: `'${row.measurementType}' is not a valid measurement_type` });
                    continue;
                }
                measurementTypeId = mt.id;
            }

            let fuelTypeId: number | null = null;
            if (row.fuelType) {
                const ft = fuelTypeMap.get(row.fuelType.toLowerCase());
                if (!ft) {
                    errors.push({ row: row.row, input, message: `'${row.fuelType}' is not a valid fuel_type` });
                    continue;
                }
                fuelTypeId = ft.id;
            }

            const typeIds: number[] = [];
            if (row.types) {
                const typeNames = row.types.split(',').map(t => t.trim()).filter(Boolean);
                let typeError = false;
                for (const typeName of typeNames) {
                    const itemType = itemTypeMap.get(typeName.toLowerCase());
                    if (!itemType) {
                        errors.push({ row: row.row, input, message: `'${typeName}' is not a valid item type` });
                        typeError = true;
                        break;
                    }
                    typeIds.push(itemType.id);
                }
                if (typeError) continue;
            }

            // ── Validate equipment profiles for this item ──────────────────────
            const equipEntry   = equipByItem.get(cleanCodeName) ?? { rows: [], errors: [] };
            const equipErrors  = [...equipEntry.errors];
            const validProfiles: EquipmentCandidate[] = [];

            for (const er of equipEntry.rows) {
                const ei = rowInput(er.itemCodeName, er.slotType);

                if (!er.slotType) {
                    equipErrors.push({ row: er.row, input: ei, message: 'Missing required field: slot_type' });
                    continue;
                }

                const slotType = slotTypeMap.get(er.slotType.toLowerCase());
                if (!slotType) {
                    equipErrors.push({ row: er.row, input: ei, message: `'${er.slotType}' is not a valid slot_type` });
                    continue;
                }

                const resolveOptionalLookup = <T extends { id: number }>(
                    map: Map<string, T>,
                    val: string | null,
                    label: string,
                ): { id: number | null; err: string | null } => {
                    if (!val) return { id: null, err: null };
                    const found = map.get(val.toLowerCase());
                    return found ? { id: found.id, err: null } : { id: null, err: `'${val}' is not a valid ${label}` };
                };

                const dtRes  = resolveOptionalLookup(damageTypeMap,     er.damageType,          'damage_type');
                const edtRes = resolveOptionalLookup(damageTypeMap,     er.elementalDamageType, 'elemental_damage_type');
                const acRes  = resolveOptionalLookup(actionCategoryMap, er.actionCategory,      'action_category');
                const atRes  = resolveOptionalLookup(itemActionTypeMap, er.actionType,          'action_type');
                const tsRes  = resolveOptionalLookup(targetScopeMap,    er.targetScope,         'target_scope');
                const beRes  = resolveOptionalLookup(behaviorEffectMap, er.behaviorEffectType,  'behavior_effect_type');
                const hsRes  = resolveOptionalLookup(statMap,           er.hitStat,             'hit_stat');
                const dsRes  = resolveOptionalLookup(statMap,           er.damageStat,          'damage_stat');
                const hlRes  = resolveOptionalLookup(statMap,           er.healStat,            'heal_stat');
                const ssRes  = resolveOptionalLookup(statMap,           er.savingThrowStat,     'saving_throw_stat');
                const spRes  = resolveOptionalLookup(speciesMap,        er.summonSpecies,       'summon_species codeName');
                const evRes  = resolveOptionalLookup(eventDefMap,       er.triggersEventDef,    'triggers_event_def codeName');

                const lookupErrors = [dtRes, edtRes, acRes, atRes, tsRes, beRes, hsRes, dsRes, hlRes, ssRes, spRes, evRes]
                    .map(r => r.err).filter((e): e is string => e !== null);
                if (lookupErrors.length > 0) {
                    for (const msg of lookupErrors) equipErrors.push({ row: er.row, input: ei, message: msg });
                    continue;
                }

                validProfiles.push({
                    dto:                   er,
                    slotTypeId:            slotType.id,
                    slotCost:              er.slotCost ?? 1,
                    label:                 er.label ?? null,
                    acModifier:            er.acModifier ?? 0,
                    damageDiceCount:       er.damageDiceCount ?? null,
                    damageDiceSides:       er.damageDiceSides ?? null,
                    damageTypeId:          dtRes.id,
                    elementalDiceCount:    er.elementalDiceCount ?? null,
                    elementalDiceSides:    er.elementalDiceSides ?? null,
                    elementalDamageTypeId: edtRes.id,
                    healDiceCount:         er.healDiceCount ?? null,
                    healDiceSides:         er.healDiceSides ?? null,
                    isMagical:             er.isMagical ?? false,
                    actionCategoryId:      acRes.id,
                    actionTypeId:          atRes.id,
                    targetScopeId:         tsRes.id,
                    cooldownRounds:        er.cooldownRounds ?? 0,
                    durationRounds:        er.durationRounds ?? 0,
                    behaviorEffectTypeId:  beRes.id,
                    flatModifier:          er.flatModifier ?? null,
                    percentModifier:       er.percentModifier ?? null,
                    isReactionAction:      er.isReactionAction ?? false,
                    requiresVerbal:        er.requiresVerbal ?? false,
                    requiresSomatic:       er.requiresSomatic ?? false,
                    allowedInSpar:         er.allowedInSpar ?? true,
                    usageContext:          er.usageContext ?? null,
                    hitStatId:             hsRes.id,
                    damageStatId:          dsRes.id,
                    healStatId:            hlRes.id,
                    hitBonus:              er.hitBonus ?? 0,
                    damageBonus:           er.damageBonus ?? 0,
                    healBonus:             er.healBonus ?? 0,
                    savingThrowStatId:     ssRes.id,
                    saveDC:                er.saveDC ?? null,
                    triggersEventDefId:    evRes.id,
                    triggerDC:             er.triggerDC ?? null,
                    outOfCombatMaxTargets: er.outOfCombatMaxTargets ?? null,
                    summonSpeciesId:       spRes.id,
                    summonDiceCount:       er.summonDiceCount ?? null,
                    summonDiceSides:       er.summonDiceSides ?? null,
                    attackCount:           er.attackCount ?? null,
                });
            }
            errors.push(...equipErrors);

            // ── Food profile for this item ─────────────────────────────────────
            const foodEntry = foodByItem.get(cleanCodeName);
            let foodProfile: ItemCandidate['foodProfile'] = null;
            if (foodEntry?.data) {
                const fd = foodEntry.data;
                foodProfile = {
                    meatNutritionPerGram:  fd.meatNutritionPerGram  ?? 0,
                    meatHydrationPerGram:  fd.meatHydrationPerGram  ?? 0,
                    plantNutritionPerGram: fd.plantNutritionPerGram ?? 0,
                    plantHydrationPerGram: fd.plantHydrationPerGram ?? 0,
                };
            }

            // ── Actions + effects for this item ────────────────────────────────
            const actionEntry  = actionByItem.get(cleanCodeName) ?? { rows: [], errors: [] };
            const actionErrors = [...actionEntry.errors];
            const validActions: ActionCandidate[] = [];
            const interactionsSeen = new Set<number>();

            for (const ar of actionEntry.rows) {
                const ai = rowInput(ar.itemCodeName, ar.interaction);

                if (!ar.interaction) {
                    actionErrors.push({ row: ar.row, input: ai, message: 'Missing required field: interaction' });
                    continue;
                }

                const interaction = itemInteractionMap.get(ar.interaction.toLowerCase());
                if (!interaction) {
                    actionErrors.push({ row: ar.row, input: ai, message: `'${ar.interaction}' is not a valid item interaction` });
                    continue;
                }

                if (interactionsSeen.has(interaction.id)) {
                    actionErrors.push({ row: ar.row, input: ai, message: `Duplicate interaction '${ar.interaction}' for this item` });
                    continue;
                }
                interactionsSeen.add(interaction.id);

                // Effects for this action key
                const effectKey   = `${cleanCodeName}::${ar.interaction.toLowerCase()}`;
                const effectEntry = effectByActionKey.get(effectKey) ?? { rows: [], errors: [] };
                const effectErrors = [...effectEntry.errors];
                const validEffects: ActionCandidate['effects'] = [];

                for (const efr of effectEntry.rows) {
                    const efi = rowInput(efr.itemCodeName, efr.interaction, efr.symptom);

                    if (!efr.symptom || !efr.relationType) {
                        const missing = ([
                            !efr.symptom      && 'symptom',
                            !efr.relationType && 'relation_type',
                        ] as (string | false)[]).filter(Boolean).join(', ');
                        effectErrors.push({ row: efr.row, input: efi, message: `Missing required field(s): ${missing}` });
                        continue;
                    }

                    const symptom = symptomMap.get(efr.symptom.toLowerCase());
                    if (!symptom) {
                        effectErrors.push({ row: efr.row, input: efi, message: `'${efr.symptom}' is not a recognised symptom` });
                        continue;
                    }

                    const relationType = relationTypeMap.get(efr.relationType.toLowerCase());
                    if (!relationType) {
                        effectErrors.push({ row: efr.row, input: efi, message: `'${efr.relationType}' is not a valid relation_type for item effects` });
                        continue;
                    }

                    validEffects.push({
                        symptomId:      symptom.id,
                        relationTypeId: relationType.id,
                        effectiveness:  efr.effectiveness ?? null,
                    });
                }

                errors.push(...effectErrors);

                validActions.push({
                    itemInteractionId: interaction.id,
                    energyCost:        ar.energyCost ?? 0,
                    consumedOnUse:     ar.consumedOnUse ?? false,
                    effects:           validEffects,
                });
            }
            errors.push(...actionErrors);

            candidates.push({
                dto:             row,
                codeName:        cleanCodeName,
                name:            nameCheck.value,
                description:     cleanDescription,
                typeIds,
                measurementTypeId,
                averageWeight:   row.averageWeight  ?? 0,
                weightVariance:  row.weightVariance ?? 0,
                averageVolume:   row.averageVolume  ?? 0,
                rotCap:          row.rotCap        ?? null,
                maxDurability:   row.maxDurability ?? null,
                maxUses:         row.maxUses       ?? null,
                maxDailyUses:    row.maxDailyUses  ?? null,
                fuelValue:       row.fuelValue     ?? null,
                fuelTypeId,
                isEphemeral:     row.isEphemeral   ?? false,
                equipmentProfiles: validProfiles,
                foodProfile,
                actions:         validActions,
                existing:        existingMap.get(cleanCodeName),
            });
        }

        // Orphaned equipment/action rows with no matching item row
        for (const [key, entry] of equipByItem) {
            if (!seen.has(key) && entry.rows.length > 0) {
                errors.push({ row: 0, input: key, message: `equipment sheet references item '${key}' which is not in the items sheet` });
            }
        }
        for (const [key, entry] of actionByItem) {
            if (!seen.has(key) && entry.rows.length > 0) {
                errors.push({ row: 0, input: key, message: `actions sheet references item '${key}' which is not in the items sheet` });
            }
        }

        // ── Upsert all candidates sequentially to avoid exhausting the connection pool ──
        const saved:      ItemSavedRow[]       = [];
        const overwrites: ItemOverwrittenRow[] = [];

        for (const c of candidates) {
            try {
                await this.repo.upsertItem({
                    guildId:           dto.guildId,
                    codeName:          c.codeName,
                    name:              c.name,
                    description:       c.description,
                    typeIds:           c.typeIds,
                    measurementTypeId: c.measurementTypeId,
                    averageWeight:     c.averageWeight,
                    weightVariance:    c.weightVariance,
                    averageVolume:     c.averageVolume,
                    rotCap:            c.rotCap,
                    maxDurability:     c.maxDurability,
                    maxUses:           c.maxUses,
                    maxDailyUses:      c.maxDailyUses,
                    fuelValue:         c.fuelValue,
                    fuelTypeId:        c.fuelTypeId,
                    isEphemeral:       c.isEphemeral,
                    equipmentProfiles: c.equipmentProfiles,
                    foodProfile:       c.foodProfile,
                    actions:           c.actions,
                });
                saved.push({ row: c.dto.row, codeName: c.codeName, name: c.name });
                if (c.existing) {
                    overwrites.push({
                        row:      c.dto.row,
                        codeName: c.codeName,
                        oldName:  c.existing.name,
                        newName:  c.name,
                    });
                }
            } catch {
                errors.push({ row: c.dto.row, input: rowInput(c.codeName, c.name), message: 'Failed to save to database' });
            }
        }

        errors.sort((a, b) => a.row - b.row);
        return { saved, overwrites, errors };
    }
}
