import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Query } from '@nestjs/common';
import { UploadProficiencyPackDto } from './dto/upload-proficiency-pack.dto';
import { ProficienciesService } from './proficiencies.service';

@Controller('model/proficiencies')
export class ProficienciesController {
    constructor(private readonly proficienciesService: ProficienciesService) {}

    @Get('all')
    async getAll(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.proficienciesService.getAll(guildId);
    }

    @Get('delete-check')
    async deleteCheck(@Query('guildId') guildId: string, @Query('codeName') codeName: string) {
        if (!guildId || !codeName) throw new BadRequestException('guildId and codeName are required');
        return this.proficienciesService.checkDelete(guildId, codeName);
    }

    @Post('delete-one')
    @HttpCode(HttpStatus.OK)
    async deleteOne(@Body('guildId') guildId: string, @Body('codeName') codeName: string) {
        if (!guildId || !codeName) throw new BadRequestException('guildId and codeName are required');
        return this.proficienciesService.deleteOne(guildId, codeName);
    }

    @Get('one')
    async getOne(@Query('guildId') guildId: string, @Query('codeName') codeName: string) {
        if (!guildId || !codeName) throw new BadRequestException('guildId and codeName are required');
        const result = await this.proficienciesService.getOne(guildId, codeName);
        if (!result) throw new NotFoundException('Proficiency not found');
        return result;
    }

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
