import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
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
}
