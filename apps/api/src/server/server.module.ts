import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { ServerRepository } from './server.repository';
import { ServerService } from './server.service';
import { EngineConditionSeeder } from './engine-condition-seeder';

@Module({
    controllers: [ServerController],
    providers: [ServerService, ServerRepository, EngineConditionSeeder],
})
export class ServerModule {}
