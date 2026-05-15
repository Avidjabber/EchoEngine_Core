import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UploadItemPackDto } from './dto/upload-item-pack.dto';
import { ItemsService } from './items.service';

@Controller('model/items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
    constructor(private readonly itemsService: ItemsService) {}

    @Get('template-data')
    getTemplateData(@Query('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.itemsService.getTemplateData(guildId);
    }

    @Post('upload')
    @HttpCode(HttpStatus.OK)
    uploadPack(@Body() dto: UploadItemPackDto) {
        return this.itemsService.uploadPack(dto);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    resetPack(@Body('guildId') guildId: string) {
        if (!guildId) throw new BadRequestException('guildId is required');
        return this.itemsService.resetPack(guildId);
    }
}
