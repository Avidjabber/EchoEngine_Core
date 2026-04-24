import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { UploadProficiencyPackDto } from './dto/upload-proficiency-pack.dto';
import { ProficienciesService } from './proficiencies.service';

@Controller('model/proficiencies')
export class ProficienciesController {
    constructor(private readonly proficienciesService: ProficienciesService) {}

    @Get('template-data')
    getTemplateData(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.proficienciesService.getTemplateData(guildId);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    resetPack(@Body('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.proficienciesService.resetPack(guildId);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    uploadPack(@Body() dto: UploadProficiencyPackDto) {
        return this.proficienciesService.uploadPack(dto);
    }
}
