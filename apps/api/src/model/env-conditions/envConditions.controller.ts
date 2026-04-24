import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Query } from '@nestjs/common';
import { UploadEnvConditionPackDto } from './dto/upload-env-condition-pack.dto';
import { EnvConditionsService } from './envConditions.service';

@Controller('model/env-conditions')
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
    uploadPack(@Body() dto: UploadEnvConditionPackDto) {
        return this.envConditionsService.uploadPack(dto);
    }
}
