import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { ServerRepository } from './server.repository';
import { ServerService } from './server.service';

@Module({
    controllers: [ServerController],
    providers: [ServerService, ServerRepository],
})
export class ServerModule {}
