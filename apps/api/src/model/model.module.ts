import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BotApiKeyMiddleware } from '../auth/middleware/bot-api-key.middleware';
import { EnvConditionsController } from './env-conditions/envConditions.controller';
import { EnvConditionsService } from './env-conditions/envConditions.service';
import { EnvConditionsRepository } from './env-conditions/envConditions.repository';

@Module({
    controllers: [EnvConditionsController],
    providers:   [EnvConditionsService, EnvConditionsRepository],
})
export class ModelModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(BotApiKeyMiddleware)
            .forRoutes(EnvConditionsController);
    }
}
