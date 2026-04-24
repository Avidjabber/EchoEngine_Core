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

    deleteProficiencyDefById(id: number) {
        return this.db.proficiencyDef.delete({ where: { id } });
    }
}
