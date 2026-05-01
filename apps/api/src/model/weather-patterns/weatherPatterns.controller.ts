import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { UploadWeatherPatternPackDto } from './dto/upload-weather-pattern-pack.dto';
import { WeatherPatternsService } from './weatherPatterns.service';

@Controller('model/weather-patterns')
export class WeatherPatternsController {
    constructor(private readonly weatherPatternsService: WeatherPatternsService) {}

    @Get('all')
    async getAll(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.weatherPatternsService.getAll(guildId);
    }

    @Get('template-data')
    getTemplateData(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.weatherPatternsService.getTemplateData(guildId);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    resetPack(@Body('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.weatherPatternsService.resetPack(guildId);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    uploadPack(@Body() dto: UploadWeatherPatternPackDto) {
        return this.weatherPatternsService.uploadPack(dto);
    }
}
