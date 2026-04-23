import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { UploadEnvConditionPackDto } from './dto/upload-env-condition-pack.dto';
import { EnvConditionsService } from './envConditions.service';

@Controller('model/env-conditions')
export class EnvConditionsController {
    constructor(private readonly envConditionsService: EnvConditionsService) {}

    @Get('template-data')
    getTemplateData(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.envConditionsService.getTemplateData(guildId);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    uploadPack(@Body() dto: UploadEnvConditionPackDto) {
        return this.envConditionsService.uploadPack(dto);
    }
}
