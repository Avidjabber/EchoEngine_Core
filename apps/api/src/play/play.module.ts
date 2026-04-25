import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BotApiKeyMiddleware } from '../auth/middleware/bot-api-key.middleware';
import { PlayEntitiesController } from './entities/play-entities.controller';
import { PlayEntitiesService } from './entities/play-entities.service';
import { PlayEntitiesRepository } from './entities/play-entities.repository';
import { PlayCombatController } from './combat/play-combat.controller';
import { PlayCombatService } from './combat/play-combat.service';

@Module({
    controllers: [PlayEntitiesController, PlayCombatController],
    providers:   [PlayEntitiesService, PlayEntitiesRepository, PlayCombatService],
})
export class PlayModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(BotApiKeyMiddleware)
            .forRoutes(PlayEntitiesController, PlayCombatController);
    }
}
