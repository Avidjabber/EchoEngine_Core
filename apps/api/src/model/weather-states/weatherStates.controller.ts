import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UploadWeatherStatePackDto } from './dto/upload-weather-state-pack.dto';
import { WeatherStatesService } from './weatherStates.service';

@Controller('model/weather-states')
@UseGuards(JwtAuthGuard)
export class WeatherStatesController {
    constructor(private readonly weatherStatesService: WeatherStatesService) {}

    @Get('all')
    async getAll(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.weatherStatesService.getAll(guildId);
    }

    @Get('one')
    async getOne(@Query('guildId') guildId: string, @Query('codeName') codeName: string) {
        if (!guildId || !codeName) throw new BadRequestException('guildId and codeName are required');
        const result = await this.weatherStatesService.getOne(guildId, codeName);
        if (!result) throw new NotFoundException('Weather state not found');
        return result;
    }

    @Get('delete-check')
    async deleteCheck(@Query('guildId') guildId: string, @Query('codeName') codeName: string) {
        if (!guildId || !codeName) throw new BadRequestException('guildId and codeName are required');
        return this.weatherStatesService.checkDelete(guildId, codeName);
    }

    @Post('delete-one')
    @HttpCode(HttpStatus.OK)
    async deleteOne(@Body('guildId') guildId: string, @Body('codeName') codeName: string) {
        if (!guildId || !codeName) throw new BadRequestException('guildId and codeName are required');
        return this.weatherStatesService.deleteOne(guildId, codeName);
    }

    @Get('template-data')
    getTemplateData(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.weatherStatesService.getTemplateData(guildId);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    resetPack(@Body('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.weatherStatesService.resetPack(guildId);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    uploadPack(@Body() dto: UploadWeatherStatePackDto) {
        return this.weatherStatesService.uploadPack(dto);
    }
}
