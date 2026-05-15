import { Module } from '@nestjs/common';
import { BotNotifierService } from './bot-notifier.service';

@Module({
    providers: [BotNotifierService],
    exports:   [BotNotifierService],
})
export class BotNotifierModule {}
