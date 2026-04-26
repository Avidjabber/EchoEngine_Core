import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

@Injectable()
export class ActionsRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    findAllActionTypes() {
        return this.db.actionType.findMany({
            select: { id: true, name: true },
        });
    }

    findAllActionSteps() {
        return this.db.actionType_Step.findMany({
            select: { id: true, codeName: true, actionTypeId: true },
        });
    }

    findAllDisciplines() {
        return this.db.disciplineDef.findMany({
            select: { id: true, codeName: true },
        });
    }

    findAllStats() {
        return this.db.stat.findMany({
            select: { id: true, name: true },
        });
    }

    findGuildProficiencyDefs(guildId: string) {
        return this.db.proficiencyDef.findMany({
            where:  { guildId },
            select: { id: true, codeName: true },
        });
    }

    findGuildBaseConfigs(guildId: string) {
        return this.db.guild_ActionConfig.findMany({
            where:  { guildId },
            select: { actionTypeId: true, energyCost: true, dailyLimit: true, minEntities: true, maxEntities: true, durationMinutes: true, baseFactionReward: true },
        });
    }

    findGuildDisciplineRewards(guildId: string) {
        return this.db.actionType_DisciplineReward.findMany({
            where:  { guildId },
            select: { actionTypeId: true, disciplineId: true, recipientScope: true, xpAmount: true },
        });
    }

    findGuildStepConfigs(guildId: string) {
        return this.db.guild_ActionStep_Config.findMany({
            where:  { guildId },
            select: { stepId: true, proficiencyDefId: true, statId: true },
        });
    }

    findGuildDisciplineRequirements(guildId: string) {
        return this.db.actionType_DisciplineRequirement.findMany({
            where:  { guildId },
            select: { actionTypeId: true, disciplineId: true, minLevel: true, scope: true },
        });
    }

    upsertBaseConfig(data: {
        guildId:           string;
        actionTypeId:      number;
        energyCost:        number;
        dailyLimit:        number | null;
        minEntities:       number;
        maxEntities:       number | null;
        durationMinutes:   number | null;
        baseFactionReward: number;
    }) {
        return this.db.guild_ActionConfig.upsert({
            where:  { guildId_actionTypeId: { guildId: data.guildId, actionTypeId: data.actionTypeId } },
            create: data,
            update: {
                energyCost:        data.energyCost,
                dailyLimit:        data.dailyLimit,
                minEntities:       data.minEntities,
                maxEntities:       data.maxEntities,
                durationMinutes:   data.durationMinutes,
                baseFactionReward: data.baseFactionReward,
            },
        });
    }

    upsertDisciplineReward(data: {
        guildId:        string;
        actionTypeId:   number;
        disciplineId:   number;
        xpAmount:       number;
        recipientScope: string;
    }) {
        return this.db.actionType_DisciplineReward.upsert({
            where:  { guildId_actionTypeId_disciplineId_recipientScope: { guildId: data.guildId, actionTypeId: data.actionTypeId, disciplineId: data.disciplineId, recipientScope: data.recipientScope } },
            create: data,
            update: { xpAmount: data.xpAmount },
        });
    }

    upsertStepConfig(data: {
        guildId:          string;
        stepId:           number;
        proficiencyDefId: number | null;
        statId:           number | null;
    }) {
        return this.db.guild_ActionStep_Config.upsert({
            where:  { guildId_stepId: { guildId: data.guildId, stepId: data.stepId } },
            create: data,
            update: { proficiencyDefId: data.proficiencyDefId, statId: data.statId },
        });
    }

    upsertDisciplineRequirement(data: {
        guildId:      string;
        actionTypeId: number;
        disciplineId: number;
        minLevel:     number;
        scope:        string;
    }) {
        return this.db.actionType_DisciplineRequirement.upsert({
            where:  { guildId_actionTypeId_disciplineId: { guildId: data.guildId, actionTypeId: data.actionTypeId, disciplineId: data.disciplineId } },
            create: data,
            update: { minLevel: data.minLevel, scope: data.scope },
        });
    }
}
