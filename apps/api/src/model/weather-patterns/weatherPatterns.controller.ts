import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WeatherPatternsService } from './weatherPatterns.service';

@Controller('model/weather-patterns')
@UseGuards(JwtAuthGuard)
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

    @Get('download')
    async downloadPack(
        @Query('guildId') guildId: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        if (!guildId) throw new BadRequestException('guildId is required');
        const buffer = await this.weatherPatternsService.downloadPack(guildId);
        res.set({
            'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="weather-patterns.xlsx"',
        });
        return new StreamableFile(buffer);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    resetPack(@Body('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.weatherPatternsService.resetPack(guildId);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    async uploadPack(
        @UploadedFile() file: Express.Multer.File,
        @Body('guildId') guildId: string,
    ) {
        if (!guildId) throw new BadRequestException('guildId is required');
        if (!file)    throw new BadRequestException('file is required');
        return this.weatherPatternsService.uploadPack(guildId, file.buffer);
    }
}
