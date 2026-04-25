import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { PlayCombatService } from './play-combat.service';
import { StartCombatTeam } from './play-combat.repository';

interface StartCombatDto {
    guildId: string;
    type:    'spar' | 'fight';
    teams:   StartCombatTeam[];
}

@Controller('play/combat')
export class PlayCombatController {
    constructor(private readonly service: PlayCombatService) {}

    @Get('invite-targets')
    getInviteTargets(
        @Query('guildId')           guildId:           string,
        @Query('initiatorEntityId') initiatorEntityId: string,
        @Query('mode')              mode:              'spar' | 'fight',
    ) {
        return this.service.getInviteTargets(guildId, parseInt(initiatorEntityId, 10), mode);
    }

    @Get('signup-targets')
    getSignupTargets(
        @Query('guildId')            guildId:            string,
        @Query('userId')             userId:             string,
        @Query('initiatorFactionId') initiatorFactionId: string,
        @Query('mode')               mode:               'spar' | 'fight',
    ) {
        return this.service.getSignupTargets(guildId, userId, parseInt(initiatorFactionId, 10), mode);
    }

    @Post('start')
    @HttpCode(HttpStatus.OK)
    startCombat(@Body() dto: StartCombatDto) {
        if (!dto.guildId || !dto.type || !Array.isArray(dto.teams)) {
            throw new BadRequestException('guildId, type, and teams are required');
        }
        return this.service.startCombat(dto.guildId, dto.type, dto.teams);
    }

    @Get(':id/participants')
    getParticipants(@Param('id', ParseIntPipe) id: number) {
        return this.service.getParticipants(id);
    }

    @Get(':id/available-actions')
    getAvailableActions(
        @Param('id', ParseIntPipe) id:       number,
        @Query('entityId')         entityId: string,
        @Query('category')         category: 'main' | 'bonus' | 'item',
    ) {
        if (!entityId || !category) throw new BadRequestException('entityId and category are required');
        return this.service.getAvailableActions(id, parseInt(entityId, 10), category);
    }

    @Post(':id/advance-turn')
    @HttpCode(HttpStatus.OK)
    advanceTurn(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { currentEntityId: number },
    ) {
        if (!body?.currentEntityId) throw new BadRequestException('currentEntityId is required');
        return this.service.advanceTurn(id, body.currentEntityId);
    }
}
