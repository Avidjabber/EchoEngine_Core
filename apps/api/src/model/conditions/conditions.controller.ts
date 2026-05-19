import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ConditionsService } from './conditions.service';

@Controller('model/conditions')
@UseGuards(JwtAuthGuard)
export class ConditionsController {
    constructor(private readonly conditionsService: ConditionsService) {}

    @Get('template-data')
    getTemplateData(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.conditionsService.getTemplateData(guildId);
    }

    @Get('download')
    download(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.conditionsService.downloadPack(guildId);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    uploadPack(
        @UploadedFile() file: Express.Multer.File,
        @Body('guildId') guildId: string,
    ) {
        if (!guildId) throw new BadRequestException('guildId is required');
        if (!file)    throw new BadRequestException('file is required');
        return this.conditionsService.uploadPack(guildId, file.buffer);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    resetPack(@Body('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.conditionsService.resetPack(guildId);
    }
}
