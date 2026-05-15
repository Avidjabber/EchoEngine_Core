import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeatherTickDto } from './dto/weather-tick.dto';
import { WeatherSimService } from './weather-sim.service';

@Controller('weather-sim')
@UseGuards(JwtAuthGuard)
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
