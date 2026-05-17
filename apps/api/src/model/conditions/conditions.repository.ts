import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

export interface UpsertConditionData {
    guildId:                 string;
    codeName:                string;
    name:                    string;
    description:             string | null;
    conditionTypeId:         number;
    conditionContextId:      number;
    isDeathSaveFailureConsequence: boolean;
    isHidden:                boolean;
    isFatalAtCap:            boolean;
    progressionCap:          number | null;
    dailyRollDC:             number | null;
    maxDays:                 number | null;
    durationMinutes:         number | null;
    spawnThreshold:          number | null;
    contagionResistDC:       number | null;
    energyDebuf:             number | null;
    blocksVerbal:            boolean;
    blocksSomatic:           boolean;
    statEffects:       Array<{ statId: number; amount: number }>;
    profEffects:       Array<{ proficiencyDefId: number; amount: number | null; hasDisadvantage: boolean }>;
    combatEffects:     Array<{ effectTypeId: number; statId: number | null; flatModifier: number | null }>;
    combatStatEffects: Array<{ effectDefId: number; applicationChance: number }>;
    damageModifiers:   Array<{ damageTypeId: number; isResistant: boolean }>;
    envRules:          Array<{ envConditionId: number; relationTypeId: number; value: number }>;
    symptomTags:       Array<{ symptomId: number }>;
    grantedItems:      Array<{ itemId: number; grantedToSource: boolean; usesPerApplication: number | null; minProgression: number | null; maxProgression: number | null }>;
    behaviorEffects:   Array<{ actionTypeId: number | null; perspective: string; behaviorTypeId: number; triggerChance: number; redirectTargetId: number | null; biasWeight: number | null; restrictActionTypeId: number | null; restrictIsBlock: boolean }>;
}

export interface UpsertConditionLinksData {
    conditionId: number;
    links:       Array<{ childConditionId: number; relationTypeId: number; weight: number }>;
}

@Injectable()
export class ConditionsRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    findAllConditionTypes() {
        return this.db.conditionType.findMany({ select: { id: true, name: true } });
    }

    findAllConditionContexts() {
        return this.db.conditionContext.findMany({ select: { id: true, name: true } });
    }

    findAllStats() {
        return this.db.stat.findMany({ select: { id: true, name: true } });
    }

    findGuildProficiencyDefs(guildId: string) {
        return this.db.proficiencyDef.findMany({
            where:  { guildId },
            select: { id: true, codeName: true },
        });
    }

    findAllCombatEffectTypes() {
        return this.db.combatEffectType.findMany({ select: { id: true, name: true } });
    }

    findGuildCombatStatEffectDefs(guildId: string) {
        return this.db.combatStatEffectDef.findMany({
            where:  { guildId },
            select: { id: true, codeName: true },
        });
    }

    findAllDamageTypes() {
        return this.db.damageType.findMany({ select: { id: true, name: true } });
    }

    findAllEnvConditions() {
        return this.db.envCondition.findMany({ select: { id: true, codeName: true } });
    }

    findAllSymptoms() {
        return this.db.symptom.findMany({ select: { id: true, name: true } });
    }

    findGuildItems(guildId: string) {
        return this.db.item.findMany({
            where:  { guildId },
            select: { id: true, codeName: true },
        });
    }

    findAllItemActionTypes() {
        return this.db.itemActionType.findMany({ select: { id: true, name: true } });
    }

    findAllConditionBehaviorTypes() {
        return this.db.conditionBehaviorType.findMany({ select: { id: true, name: true } });
    }

    findAllBehaviorRedirectTargets() {
        return this.db.behaviorRedirectTarget.findMany({ select: { id: true, name: true } });
    }

    findConditionRelationTypes() {
        return this.db.relationType.findMany({
            where:  { isConditionSystem: true },
            select: { id: true, name: true },
        });
    }

    findGuildConditions(guildId: string) {
        return this.db.conditionDef.findMany({
            where:   { guildId },
            select:  { id: true, codeName: true, name: true, isEngineOwned: true },
            orderBy: { codeName: 'asc' },
        });
    }

    async upsertCondition(data: UpsertConditionData): Promise<{ id: number; codeName: string; name: string }> {
        return this.db.$transaction(async (tx) => {
            const condition = await tx.conditionDef.upsert({
                where:  { guildId_codeName: { guildId: data.guildId, codeName: data.codeName } },
                create: {
                    guildId:                 data.guildId,
                    codeName:                data.codeName,
                    name:                    data.name,
                    description:             data.description,
                    conditionTypeId:         data.conditionTypeId,
                    conditionContextId:      data.conditionContextId,
                    isDeathSaveFailureConsequence: data.isDeathSaveFailureConsequence,
                    isHidden:                data.isHidden,
                    isFatalAtCap:            data.isFatalAtCap,
                    progressionCap:          data.progressionCap,
                    dailyRollDC:             data.dailyRollDC,
                    maxDays:                 data.maxDays,
                    durationMinutes:         data.durationMinutes,
                    spawnThreshold:          data.spawnThreshold,
                    contagionResistDC:       data.contagionResistDC,
                    energyDebuf:             data.energyDebuf,
                    blocksVerbal:            data.blocksVerbal,
                    blocksSomatic:           data.blocksSomatic,
                },
                update: {
                    name:                    data.name,
                    description:             data.description,
                    conditionTypeId:         data.conditionTypeId,
                    conditionContextId:      data.conditionContextId,
                    isDeathSaveFailureConsequence: data.isDeathSaveFailureConsequence,
                    isHidden:                data.isHidden,
                    isFatalAtCap:            data.isFatalAtCap,
                    progressionCap:          data.progressionCap,
                    dailyRollDC:             data.dailyRollDC,
                    maxDays:                 data.maxDays,
                    durationMinutes:         data.durationMinutes,
                    spawnThreshold:          data.spawnThreshold,
                    contagionResistDC:       data.contagionResistDC,
                    energyDebuf:             data.energyDebuf,
                    blocksVerbal:            data.blocksVerbal,
                    blocksSomatic:           data.blocksSomatic,
                },
                select: { id: true, codeName: true, name: true },
            });

            await tx.conditionDef_StatEffect.deleteMany({ where: { conditionDefId: condition.id } });
            if (data.statEffects.length > 0) {
                await tx.conditionDef_StatEffect.createMany({
                    data: data.statEffects.map(e => ({ conditionDefId: condition.id, statId: e.statId, amount: e.amount })),
                });
            }

            await tx.conditionDef_ProficiencyEffect.deleteMany({ where: { conditionDefId: condition.id } });
            if (data.profEffects.length > 0) {
                await tx.conditionDef_ProficiencyEffect.createMany({
                    data: data.profEffects.map(e => ({
                        conditionDefId:  condition.id,
                        proficiencyDefId: e.proficiencyDefId,
                        amount:          e.amount ?? undefined,
                        hasDisadvantage: e.hasDisadvantage,
                    })),
                });
            }

            await tx.conditionDef_CombatEffect.deleteMany({ where: { conditionDefId: condition.id } });
            if (data.combatEffects.length > 0) {
                await tx.conditionDef_CombatEffect.createMany({
                    data: data.combatEffects.map(e => ({
                        conditionDefId: condition.id,
                        effectTypeId:   e.effectTypeId,
                        statId:         e.statId ?? undefined,
                        flatModifier:   e.flatModifier ?? undefined,
                    })),
                });
            }

            await tx.conditionDef_CombatStatEffect.deleteMany({ where: { conditionDefId: condition.id } });
            if (data.combatStatEffects.length > 0) {
                await tx.conditionDef_CombatStatEffect.createMany({
                    data: data.combatStatEffects.map(e => ({
                        conditionDefId:    condition.id,
                        effectDefId:       e.effectDefId,
                        applicationChance: e.applicationChance,
                    })),
                });
            }

            await tx.conditionDef_DamageModifier.deleteMany({ where: { conditionDefId: condition.id } });
            if (data.damageModifiers.length > 0) {
                await tx.conditionDef_DamageModifier.createMany({
                    data: data.damageModifiers.map(e => ({
                        conditionDefId: condition.id,
                        damageTypeId:   e.damageTypeId,
                        isResistant:    e.isResistant,
                    })),
                });
            }

            await tx.conditionDef_EnvRule.deleteMany({ where: { conditionDefId: condition.id } });
            if (data.envRules.length > 0) {
                await tx.conditionDef_EnvRule.createMany({
                    data: data.envRules.map(e => ({
                        conditionDefId: condition.id,
                        envConditionId: e.envConditionId,
                        relationTypeId: e.relationTypeId,
                        value:          e.value,
                    })),
                });
            }

            await tx.conditionDef_SymptomTag.deleteMany({ where: { conditionDefId: condition.id } });
            if (data.symptomTags.length > 0) {
                await tx.conditionDef_SymptomTag.createMany({
                    data: data.symptomTags.map(e => ({ conditionDefId: condition.id, symptomId: e.symptomId })),
                });
            }

            await tx.conditionDef_GrantedItem.deleteMany({ where: { conditionDefId: condition.id } });
            if (data.grantedItems.length > 0) {
                await tx.conditionDef_GrantedItem.createMany({
                    data: data.grantedItems.map(e => ({
                        conditionDefId:    condition.id,
                        itemId:            e.itemId,
                        grantedToSource:   e.grantedToSource,
                        usesPerApplication: e.usesPerApplication ?? undefined,
                        minProgression:    e.minProgression ?? undefined,
                        maxProgression:    e.maxProgression ?? undefined,
                    })),
                });
            }

            await tx.conditionBehaviorEffect.deleteMany({ where: { conditionDefId: condition.id } });
            if (data.behaviorEffects.length > 0) {
                await tx.conditionBehaviorEffect.createMany({
                    data: data.behaviorEffects.map(e => ({
                        conditionDefId:       condition.id,
                        actionTypeId:         e.actionTypeId ?? undefined,
                        perspective:          e.perspective,
                        behaviorTypeId:       e.behaviorTypeId,
                        triggerChance:        e.triggerChance,
                        redirectTargetId:     e.redirectTargetId ?? undefined,
                        biasWeight:           e.biasWeight ?? undefined,
                        restrictActionTypeId: e.restrictActionTypeId ?? undefined,
                        restrictIsBlock:      e.restrictIsBlock,
                    })),
                });
            }

            return condition;
        });
    }

    async upsertConditionLinks(data: UpsertConditionLinksData) {
        return this.db.$transaction(async (tx) => {
            await tx.conditionDef_Link.deleteMany({ where: { parentConditionId: data.conditionId } });
            if (data.links.length > 0) {
                await tx.conditionDef_Link.createMany({
                    data: data.links.map(l => ({
                        parentConditionId: data.conditionId,
                        childConditionId:  l.childConditionId,
                        relationTypeId:    l.relationTypeId,
                        weight:            l.weight,
                    })),
                });
            }
        });
    }

    deleteConditionById(id: number) {
        return this.db.conditionDef.delete({ where: { id } });
    }
}
