import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WeatherTickDto } from './dto/weather-tick.dto';
import { WeatherSimService } from './weather-sim.service';

@Controller('weather-sim')
export class WeatherSimController {
    constructor(private readonly weatherSimService: WeatherSimService) {}

    @Post('tick-all')
    @HttpCode(HttpStatus.OK)
    tickAll() {
        return this.weatherSimService.tickAll();
    }

    @Post('tick')
    @HttpCode(HttpStatus.OK)
    tick(@Body() dto: WeatherTickDto) {
        return this.weatherSimService.tick(dto);
    }
}
