import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

@Injectable()
export class ProficienciesRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    findAllStats() {
        return this.db.stat.findMany({
            select: { id: true, name: true },
        });
    }

    findGuildProficiencyDefs(guildId: string) {
        return this.db.proficiencyDef.findMany({
            where:   { guildId },
            select:  { id: true, codeName: true, name: true, description: true, stat: { select: { id: true, name: true } } },
            orderBy: { codeName: 'asc' },
        });
    }

    upsertProficiencyDef(data: {
        guildId:     string;
        codeName:    string;
        name:        string;
        description: string | null;
        statId:      number;
    }) {
        return this.db.proficiencyDef.upsert({
            where:  { guildId_codeName: { guildId: data.guildId, codeName: data.codeName } },
            create: data,
            update: { name: data.name, description: data.description, statId: data.statId },
        });
    }

    findGuildProficiencyDef(guildId: string, codeName: string) {
        return this.db.proficiencyDef.findUnique({
            where:  { guildId_codeName: { guildId, codeName } },
            select: { codeName: true, name: true, description: true, stat: { select: { name: true } } },
        });
    }

    checkDeleteProficiencyDef(guildId: string, codeName: string) {
        return this.db.proficiencyDef.findUnique({
            where:  { guildId_codeName: { guildId, codeName } },
            select: {
                name: true,
                _count: {
                    select: {
                        entityProficiencies:           true,
                        conditionEffects:              true,
                        abilityProficiencyModifiers:   true,
                        envConditionMods:              true,
                        combatActionConditions:        true,
                        actionStepConfigs:             true,
                        guildSpeciesActionStepConfigs: true,
                        eventEffects:                  true,
                        eventCheckSteps:               true,
                    },
                },
            },
        });
    }

    deleteProficiencyDefByCodeName(guildId: string, codeName: string) {
        return this.db.proficiencyDef.delete({
            where: { guildId_codeName: { guildId, codeName } },
        });
    }

    deleteProficiencyDefById(id: number) {
        return this.db.proficiencyDef.delete({ where: { id } });
    }
}
