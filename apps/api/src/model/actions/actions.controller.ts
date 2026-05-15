import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UploadActionPackDto } from './dto/upload-action-pack.dto';
import { ActionsService } from './actions.service';

@Controller('model/actions')
@UseGuards(JwtAuthGuard)
export class ActionsController {
    constructor(private readonly actionsService: ActionsService) {}

    @Get('template-data')
    getTemplateData(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.actionsService.getTemplateData(guildId);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    uploadPack(@Body() dto: UploadActionPackDto) {
        return this.actionsService.uploadPack(dto);
    }
}
