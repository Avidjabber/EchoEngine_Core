import { Module } from '@nestjs/common';
import { BotNotifierModule } from '../bot-notifier/bot-notifier.module';
import { WeatherSimController } from './weather-sim.controller';
import { WeatherSimService } from './weather-sim.service';
import { WeatherSimRepository } from './weather-sim.repository';

@Module({
    imports:     [BotNotifierModule],
    controllers: [WeatherSimController],
    providers:   [WeatherSimService, WeatherSimRepository],
})
export class WeatherSimModule {}
