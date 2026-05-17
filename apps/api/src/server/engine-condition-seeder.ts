import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../database/primary.service';
import { ENGINE_CONDITIONS } from './engine-conditions';

@Injectable()
export class EngineConditionSeeder {
    constructor(private readonly db: PrimaryDatabaseService) {}

    async seedForGuild(guildId: string): Promise<void> {
        const [types, contexts] = await Promise.all([
            this.db.conditionType.findMany({ select: { id: true, name: true } }),
            this.db.conditionContext.findMany({ select: { id: true, name: true } }),
        ]);

        const typeMap    = new Map(types.map(t    => [t.name, t.id]));
        const contextMap = new Map(contexts.map(c => [c.name, c.id]));

        await this.db.conditionDef.createMany({
            skipDuplicates: true,
            data: ENGINE_CONDITIONS.map(c => ({
                guildId,
                codeName:                      c.codeName,
                name:                          c.name,
                conditionTypeId:               typeMap.get(c.conditionType)!,
                conditionContextId:            contextMap.get(c.conditionContext)!,
                isEngineOwned:                 true,
                isDeathSaveFailureConsequence: c.isDeathSaveFailureConsequence ?? false,
            })),
        });
    }
}
