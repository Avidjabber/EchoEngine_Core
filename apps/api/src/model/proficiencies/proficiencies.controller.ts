import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProficienciesService } from './proficiencies.service';

@Controller('model/proficiencies')
@UseGuards(JwtAuthGuard)
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

    @Post('upsert-one')
    @HttpCode(HttpStatus.OK)
    async upsertOne(
        @Body('guildId')     guildId:     string,
        @Body('codeName')    codeName:    string,
        @Body('name')        name:        string,
        @Body('stat')        stat:        string,
        @Body('description') description: string | null,
    ) {
        if (!guildId || !codeName || !name || !stat) throw new BadRequestException('guildId, codeName, name, and stat are required');
        return this.proficienciesService.upsertOne(guildId, codeName, name, stat, description ?? null);
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
        return this.proficienciesService.uploadPack(guildId, file.buffer);
    }
}
