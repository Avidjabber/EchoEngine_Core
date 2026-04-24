import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BotApiKeyMiddleware } from '../auth/middleware/bot-api-key.middleware';
import { ApiCacheService } from '../cache/api-cache.service';
import { EnvConditionsController } from './env-conditions/envConditions.controller';
import { EnvConditionsService } from './env-conditions/envConditions.service';
import { EnvConditionsRepository } from './env-conditions/envConditions.repository';
import { ProficienciesController } from './proficiencies/proficiencies.controller';
import { ProficienciesService } from './proficiencies/proficiencies.service';
import { ProficienciesRepository } from './proficiencies/proficiencies.repository';

@Module({
    controllers: [EnvConditionsController, ProficienciesController],
    providers:   [ApiCacheService, EnvConditionsService, EnvConditionsRepository, ProficienciesService, ProficienciesRepository],
})
export class ModelModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(BotApiKeyMiddleware)
            .forRoutes(EnvConditionsController, ProficienciesController);
    }
}
