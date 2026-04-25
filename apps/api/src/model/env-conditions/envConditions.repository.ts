import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

@Injectable()
export class EnvConditionsRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    findAllEnvConditions() {
        return this.db.envCondition.findMany({
            select: { id: true, codeName: true },
        });
    }

    findAllEnvConditionsWithNames() {
        return this.db.envCondition.findMany({
            select:  { codeName: true, name: true },
            orderBy: { name: 'asc' },
        });
    }

    findEnvModifierEffectTypes() {
        return this.db.effectType.findMany({
            where:  { isEnvModifier: true },
            select: { id: true, name: true },
        });
    }

    findEnvConditionRelationTypes() {
        return this.db.relationType.findMany({
            where:  { isEnvConditionSystem: true },
            select: { id: true, name: true },
        });
    }

    findAllStats() {
        return this.db.stat.findMany({
            select: { id: true, name: true },
        });
    }

    findProficiencyDefs(guildId: string) {
        return this.db.proficiencyDef.findMany({
            where:  { guildId },
            select: { id: true, codeName: true },
        });
    }

    async getGuildModifiers(guildId: string) {
        const [worldModifiers, statModifiers, proficiencyModifiers] = await Promise.all([
            this.db.envCondition_Modifier.findMany({
                where:   { guildId },
                select:  {
                    envCondition: { select: { codeName: true } },
                    effectType:   { select: { name: true } },
                    relationType: { select: { name: true } },
                    value:        true,
                },
                orderBy: [{ envCondition: { codeName: 'asc' } }, { effectType: { name: 'asc' } }],
            }),
            this.db.envCondition_StatModifier.findMany({
                where:   { guildId },
                select:  {
                    envCondition: { select: { codeName: true } },
                    stat:         { select: { name: true } },
                    value:        true,
                },
                orderBy: [{ envCondition: { codeName: 'asc' } }, { stat: { name: 'asc' } }],
            }),
            this.db.envCondition_ProficiencyModifier.findMany({
                where:   { guildId },
                select:  {
                    envCondition: { select: { codeName: true } },
                    proficiency:  { select: { codeName: true } },
                    value:           true,
                    hasDisadvantage: true,
                    hasAdvantage:    true,
                },
                orderBy: [{ envCondition: { codeName: 'asc' } }, { proficiency: { codeName: 'asc' } }],
            }),
        ]);
        return { worldModifiers, statModifiers, proficiencyModifiers };
    }

    findEnvConditionIdByCodeName(codeName: string) {
        return this.db.envCondition.findUnique({
            where:  { codeName },
            select: { id: true },
        });
    }

    async deleteConditionModifiers(guildId: string, envConditionId: number) {
        const [worldResult, statResult, profResult] = await Promise.all([
            this.db.envCondition_Modifier.deleteMany({ where: { guildId, envConditionId } }),
            this.db.envCondition_StatModifier.deleteMany({ where: { guildId, envConditionId } }),
            this.db.envCondition_ProficiencyModifier.deleteMany({ where: { guildId, envConditionId } }),
        ]);
        return {
            worldModifiers:       worldResult.count,
            statModifiers:        statResult.count,
            proficiencyModifiers: profResult.count,
        };
    }

    async deleteAllGuildModifiers(guildId: string) {
        const [worldResult, statResult, profResult] = await Promise.all([
            this.db.envCondition_Modifier.deleteMany({ where: { guildId } }),
            this.db.envCondition_StatModifier.deleteMany({ where: { guildId } }),
            this.db.envCondition_ProficiencyModifier.deleteMany({ where: { guildId } }),
        ]);
        return {
            worldModifiers:       worldResult.count,
            statModifiers:        statResult.count,
            proficiencyModifiers: profResult.count,
        };
    }

    deleteWorldModifier(guildId: string, envConditionId: number, effectTypeId: number) {
        return this.db.envCondition_Modifier.deleteMany({ where: { guildId, envConditionId, effectTypeId } });
    }

    deleteStatModifier(guildId: string, envConditionId: number, statId: number) {
        return this.db.envCondition_StatModifier.deleteMany({ where: { guildId, envConditionId, statId } });
    }

    deleteProfModifier(guildId: string, envConditionId: number, proficiencyDefId: number) {
        return this.db.envCondition_ProficiencyModifier.deleteMany({ where: { guildId, envConditionId, proficiencyDefId } });
    }

    upsertEnvConditionModifier(row: {
        guildId:        string;
        envConditionId: number;
        effectTypeId:   number;
        relationTypeId: number;
        value:          number | null;
    }) {
        return this.db.envCondition_Modifier.upsert({
            where: {
                guildId_envConditionId_effectTypeId: {
                    guildId:        row.guildId,
                    envConditionId: row.envConditionId,
                    effectTypeId:   row.effectTypeId,
                },
            },
            create: row,
            update: {
                relationTypeId: row.relationTypeId,
                value:          row.value,
            },
        });
    }

    upsertStatModifier(row: {
        guildId:        string;
        envConditionId: number;
        statId:         number;
        value:          number;
    }) {
        return this.db.envCondition_StatModifier.upsert({
            where: {
                guildId_envConditionId_statId: {
                    guildId:        row.guildId,
                    envConditionId: row.envConditionId,
                    statId:         row.statId,
                },
            },
            create: row,
            update: { value: row.value },
        });
    }

    upsertProficiencyModifier(row: {
        guildId:          string;
        envConditionId:   number;
        proficiencyDefId: number;
        value:            number;
        hasDisadvantage:  boolean;
        hasAdvantage:     boolean;
    }) {
        return this.db.envCondition_ProficiencyModifier.upsert({
            where: {
                guildId_envConditionId_proficiencyDefId: {
                    guildId:          row.guildId,
                    envConditionId:   row.envConditionId,
                    proficiencyDefId: row.proficiencyDefId,
                },
            },
            create: row,
            update: {
                value:           row.value,
                hasDisadvantage: row.hasDisadvantage,
                hasAdvantage:    row.hasAdvantage,
            },
        });
    }
}
