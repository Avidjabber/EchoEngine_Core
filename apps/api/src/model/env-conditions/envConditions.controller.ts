import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EnvConditionsService } from './envConditions.service';

@Controller('model/env-conditions')
@UseGuards(JwtAuthGuard)
export class EnvConditionsController {
    constructor(private readonly envConditionsService: EnvConditionsService) {}

    @Get('conditions')
    getConditionList() {
        return this.envConditionsService.getConditionList();
    }

    @Get('modifiers')
    getModifiers(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.envConditionsService.getModifiers(guildId);
    }

    @Get('template-data')
    getTemplateData(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.envConditionsService.getTemplateData(guildId);
    }

    @Get('download')
    downloadPack(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.envConditionsService.downloadPack(guildId);
    }

    @Post('condition-reset')
    @HttpCode(HttpStatus.OK)
    async resetCondition(
        @Body('guildId') guildId: string,
        @Body('conditionCodeName') conditionCodeName: string,
    ) {
        if (!guildId)          throw new BadRequestException('guildId is required');
        if (!conditionCodeName) throw new BadRequestException('conditionCodeName is required');
        const result = await this.envConditionsService.resetCondition(guildId, conditionCodeName);
        if (!result) throw new NotFoundException(`Condition '${conditionCodeName}' not found`);
        return result;
    }

    @Post('upsert-modifier')
    @HttpCode(HttpStatus.OK)
    upsertModifier(
        @Body('guildId')          guildId:          string,
        @Body('modifierType')     modifierType:     string,
        @Body('condition')        condition:        string,
        @Body('effectType')       effectType:       string | undefined,
        @Body('relation')         relation:         string | undefined,
        @Body('value')            value:            number | undefined,
        @Body('stat')             stat:             string | undefined,
        @Body('proficiency')      proficiency:      string | undefined,
        @Body('hasDisadvantage')  hasDisadvantage:  boolean | undefined,
        @Body('hasAdvantage')     hasAdvantage:     boolean | undefined,
    ) {
        if (!guildId || !modifierType || !condition) throw new BadRequestException('guildId, modifierType, and condition are required');
        if (!['world', 'stat', 'proficiency'].includes(modifierType)) throw new BadRequestException('modifierType must be world, stat, or proficiency');
        return this.envConditionsService.upsertModifier(guildId, modifierType as 'world' | 'stat' | 'proficiency', {
            condition, effectType, relation, value, stat, proficiency, hasDisadvantage, hasAdvantage,
        });
    }

    @Post('modifier-remove')
    @HttpCode(HttpStatus.OK)
    async removeModifier(
        @Body('guildId')       guildId:      string,
        @Body('condition')     condition:    string,
        @Body('modifierType')  modifierType: string,
        @Body('key')           key:          string,
    ) {
        if (!guildId || !condition || !modifierType || !key) throw new BadRequestException('guildId, condition, modifierType, and key are required');
        const removed = await this.envConditionsService.removeModifier(guildId, condition, modifierType as 'world' | 'stat' | 'proficiency', key);
        if (!removed) throw new NotFoundException('Modifier not found');
        return { removed: true };
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    resetPack(@Body('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.envConditionsService.resetPack(guildId);
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
        return this.envConditionsService.uploadPack(guildId, file.buffer);
    }
}
