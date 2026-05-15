import { Module } from '@nestjs/common';
import { BotNotifierModule } from '../bot-notifier/bot-notifier.module';
import { WorkerController } from './worker.controller';

@Module({
    imports:     [BotNotifierModule],
    controllers: [WorkerController],
})
export class WorkerModule {}
