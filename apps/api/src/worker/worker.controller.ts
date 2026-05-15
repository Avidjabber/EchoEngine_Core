import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BotNotifierService } from '../bot-notifier/bot-notifier.service';

@Controller('worker')
@UseGuards(JwtAuthGuard)
export class WorkerController {
    constructor(private readonly botNotifier: BotNotifierService) {}

    @Post('ping')
    @HttpCode(HttpStatus.OK)
    async ping() {
        await this.botNotifier.workerPing();
        return { received: true };
    }
}
