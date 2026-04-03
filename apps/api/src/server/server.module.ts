import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BotApiKeyMiddleware } from '../auth/middleware/bot-api-key.middleware';
import { ServerController } from './server.controller';
import { ServerRepository } from './server.repository';
import { ServerService } from './server.service';

@Module({
    controllers: [ServerController],
    providers: [ServerService, ServerRepository],
})
export class ServerModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(BotApiKeyMiddleware)
            .forRoutes(ServerController);
    }
}
