import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

interface UpsertEquipmentProfile {
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

interface UpsertItemAction {
    itemInteractionId: number;
    energyCost:        number;
    consumedOnUse:     boolean;
    effects: Array<{
        symptomId:      number;
        relationTypeId: number;
        effectiveness:  number | null;
    }>;
}

interface UpsertItemData {
    guildId:         string;
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
    equipmentProfiles: UpsertEquipmentProfile[];
    foodProfile:     { meatNutritionPerGram: number; meatHydrationPerGram: number; plantNutritionPerGram: number; plantHydrationPerGram: number } | null;
    actions:         UpsertItemAction[];
}

@Injectable()
export class ItemsRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    findAllMeasurementTypes() {
        return this.db.measurementType.findMany({ select: { id: true, name: true } });
    }

    findAllFuelTypes() {
        return this.db.fuelType.findMany({ select: { id: true, name: true } });
    }

    findAllItemTypes() {
        return this.db.itemType.findMany({ select: { id: true, name: true } });
    }

    findAllEquipmentSlotTypes() {
        return this.db.equipmentSlotType.findMany({ select: { id: true, name: true } });
    }

    findAllDamageTypes() {
        return this.db.damageType.findMany({ select: { id: true, name: true } });
    }

    findAllStats() {
        return this.db.stat.findMany({ select: { id: true, name: true } });
    }

    findAllCombatActionCategories() {
        return this.db.combatActionCategory.findMany({ select: { id: true, name: true } });
    }

    findAllItemActionTypes() {
        return this.db.itemActionType.findMany({ select: { id: true, name: true } });
    }

    findAllCombatTargetScopes() {
        return this.db.combatTargetScope.findMany({ select: { id: true, name: true } });
    }

    findAllCombatEffectTypes() {
        return this.db.combatEffectType.findMany({ select: { id: true, name: true } });
    }

    findAllItemInteractions() {
        return this.db.itemInteraction.findMany({ select: { id: true, name: true } });
    }

    findAllSymptoms() {
        return this.db.symptom.findMany({ select: { id: true, name: true } });
    }

    findItemRelationTypes() {
        return this.db.relationType.findMany({
            where:  { isItemSystem: true },
            select: { id: true, name: true },
        });
    }

    findGuildSpeciesCodes(guildId: string) {
        return this.db.species.findMany({
            where:  { guildId },
            select: { id: true, codeName: true },
        });
    }

    findGuildEventDefCodes(guildId: string) {
        return this.db.eventDef.findMany({
            where:  { guildId },
            select: { id: true, codeName: true },
        });
    }

    findGuildItems(guildId: string) {
        return this.db.item.findMany({
            where:   { guildId },
            select:  { id: true, codeName: true, name: true },
            orderBy: { codeName: 'asc' },
        });
    }

    findGuildItemsFull(guildId: string) {
        return this.db.item.findMany({
            where:   { guildId },
            orderBy: { codeName: 'asc' },
            select: {
                codeName:        true,
                name:            true,
                description:     true,
                averageWeight:   true,
                weightVariance:  true,
                averageVolume:   true,
                rotCap:          true,
                maxDurability:   true,
                maxUses:         true,
                maxDailyUses:    true,
                fuelValue:       true,
                isEphemeral:     true,
                measurementType: { select: { name: true } },
                fuelType:        { select: { name: true } },
                types:           { select: { itemType: { select: { name: true } } } },
                equipmentProfiles: {
                    select: {
                        slotType:              { select: { name: true } },
                        slotCost:              true,
                        label:                 true,
                        acModifier:            true,
                        damageDiceCount:       true,
                        damageDiceSides:       true,
                        damageType:            { select: { name: true } },
                        elementalDiceCount:    true,
                        elementalDiceSides:    true,
                        elementalDamageType:   { select: { name: true } },
                        healDiceCount:         true,
                        healDiceSides:         true,
                        isMagical:             true,
                        actionCategory:        { select: { name: true } },
                        actionType:            { select: { name: true } },
                        targetScope:           { select: { name: true } },
                        cooldownRounds:        true,
                        durationRounds:        true,
                        behaviorEffectType:    { select: { name: true } },
                        flatModifier:          true,
                        percentModifier:       true,
                        isReactionAction:      true,
                        requiresVerbal:        true,
                        requiresSomatic:       true,
                        allowedInSpar:         true,
                        usageContext:          true,
                        hitStat:               { select: { name: true } },
                        damageStat:            { select: { name: true } },
                        healStat:              { select: { name: true } },
                        hitBonus:              true,
                        damageBonus:           true,
                        healBonus:             true,
                        savingThrowStat:       { select: { name: true } },
                        saveDC:                true,
                        triggersEventDef:      { select: { codeName: true } },
                        triggerDC:             true,
                        outOfCombatMaxTargets: true,
                        summonSpecies:         { select: { codeName: true } },
                        summonDiceCount:       true,
                        summonDiceSides:       true,
                        attackCount:           true,
                    },
                },
                foodProfile: {
                    select: {
                        meatNutritionPerGram:  true,
                        meatHydrationPerGram:  true,
                        plantNutritionPerGram: true,
                        plantHydrationPerGram: true,
                    },
                },
                actions: {
                    select: {
                        itemInteraction: { select: { name: true } },
                        energyCost:      true,
                        consumedOnUse:   true,
                        effects: {
                            select: {
                                symptom:       { select: { name: true } },
                                relationType:  { select: { name: true } },
                                effectiveness: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async upsertItem(data: UpsertItemData) {
        return this.db.$transaction(async (tx) => {
            const item = await tx.item.upsert({
                where:  { guildId_codeName: { guildId: data.guildId, codeName: data.codeName } },
                create: {
                    guildId:           data.guildId,
                    codeName:          data.codeName,
                    name:              data.name,
                    description:       data.description,
                    measurementTypeId: data.measurementTypeId,
                    averageWeight:     data.averageWeight,
                    weightVariance:    data.weightVariance,
                    averageVolume:     data.averageVolume,
                    rotCap:            data.rotCap,
                    maxDurability:     data.maxDurability,
                    maxUses:           data.maxUses,
                    maxDailyUses:      data.maxDailyUses,
                    fuelValue:         data.fuelValue,
                    fuelTypeId:        data.fuelTypeId,
                    isEphemeral:       data.isEphemeral,
                },
                update: {
                    name:              data.name,
                    description:       data.description,
                    measurementTypeId: data.measurementTypeId,
                    averageWeight:     data.averageWeight,
                    weightVariance:    data.weightVariance,
                    averageVolume:     data.averageVolume,
                    rotCap:            data.rotCap,
                    maxDurability:     data.maxDurability,
                    maxUses:           data.maxUses,
                    maxDailyUses:      data.maxDailyUses,
                    fuelValue:         data.fuelValue,
                    fuelTypeId:        data.fuelTypeId,
                    isEphemeral:       data.isEphemeral,
                },
                select: { id: true, codeName: true, name: true },
            });

            // Types: delete all then recreate
            await tx.item_Type.deleteMany({ where: { itemId: item.id } });
            if (data.typeIds.length > 0) {
                await tx.item_Type.createMany({
                    data: data.typeIds.map(itemTypeId => ({ itemId: item.id, itemTypeId })),
                });
            }

            // Equipment profiles: delete all then recreate
            await tx.itemEquipmentProfile.deleteMany({ where: { itemId: item.id } });
            if (data.equipmentProfiles.length > 0) {
                await tx.itemEquipmentProfile.createMany({
                    data: data.equipmentProfiles.map(p => ({
                        itemId:                item.id,
                        slotTypeId:            p.slotTypeId,
                        slotCost:              p.slotCost,
                        label:                 p.label ?? undefined,
                        acModifier:            p.acModifier,
                        damageDiceCount:       p.damageDiceCount ?? undefined,
                        damageDiceSides:       p.damageDiceSides ?? undefined,
                        damageTypeId:          p.damageTypeId ?? undefined,
                        elementalDiceCount:    p.elementalDiceCount ?? undefined,
                        elementalDiceSides:    p.elementalDiceSides ?? undefined,
                        elementalDamageTypeId: p.elementalDamageTypeId ?? undefined,
                        healDiceCount:         p.healDiceCount ?? undefined,
                        healDiceSides:         p.healDiceSides ?? undefined,
                        isMagical:             p.isMagical,
                        actionCategoryId:      p.actionCategoryId ?? undefined,
                        actionTypeId:          p.actionTypeId ?? undefined,
                        targetScopeId:         p.targetScopeId ?? undefined,
                        cooldownRounds:        p.cooldownRounds,
                        durationRounds:        p.durationRounds,
                        behaviorEffectTypeId:  p.behaviorEffectTypeId ?? undefined,
                        flatModifier:          p.flatModifier ?? undefined,
                        percentModifier:       p.percentModifier ?? undefined,
                        isReactionAction:      p.isReactionAction,
                        requiresVerbal:        p.requiresVerbal,
                        requiresSomatic:       p.requiresSomatic,
                        allowedInSpar:         p.allowedInSpar,
                        usageContext:          p.usageContext ?? undefined,
                        hitStatId:             p.hitStatId ?? undefined,
                        damageStatId:          p.damageStatId ?? undefined,
                        healStatId:            p.healStatId ?? undefined,
                        hitBonus:              p.hitBonus,
                        damageBonus:           p.damageBonus,
                        healBonus:             p.healBonus,
                        savingThrowStatId:     p.savingThrowStatId ?? undefined,
                        saveDC:                p.saveDC ?? undefined,
                        triggersEventDefId:    p.triggersEventDefId ?? undefined,
                        triggerDC:             p.triggerDC ?? undefined,
                        outOfCombatMaxTargets: p.outOfCombatMaxTargets ?? undefined,
                        summonSpeciesId:       p.summonSpeciesId ?? undefined,
                        summonDiceCount:       p.summonDiceCount ?? undefined,
                        summonDiceSides:       p.summonDiceSides ?? undefined,
                        attackCount:           p.attackCount ?? undefined,
                    })),
                });
            }

            // Food profile: upsert
            if (data.foodProfile) {
                await tx.itemFoodProfile.upsert({
                    where:  { itemId: item.id },
                    create: { itemId: item.id, ...data.foodProfile },
                    update: data.foodProfile,
                });
            }

            // Actions + effects: delete all actions (cascades to effects), then recreate
            await tx.itemAction.deleteMany({ where: { itemId: item.id } });
            for (const action of data.actions) {
                const created = await tx.itemAction.create({
                    data: {
                        itemId:            item.id,
                        itemInteractionId: action.itemInteractionId,
                        energyCost:        action.energyCost,
                        consumedOnUse:     action.consumedOnUse,
                    },
                    select: { id: true },
                });
                if (action.effects.length > 0) {
                    await tx.itemEffect.createMany({
                        data: action.effects.map(e => ({
                            itemActionId:   created.id,
                            symptomId:      e.symptomId,
                            relationTypeId: e.relationTypeId,
                            effectiveness:  e.effectiveness ?? undefined,
                        })),
                    });
                }
            }

            return item;
        });
    }

    deleteItemById(id: number) {
        return this.db.item.delete({ where: { id } });
    }
}
