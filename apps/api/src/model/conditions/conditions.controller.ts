import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UploadConditionPackDto } from './dto/upload-condition-pack.dto';
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

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    uploadPack(@Body() dto: UploadConditionPackDto) {
        return this.conditionsService.uploadPack(dto);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    resetPack(@Body('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.conditionsService.resetPack(guildId);
    }
}
