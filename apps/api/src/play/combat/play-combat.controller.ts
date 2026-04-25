import { Controller, Get, Query } from '@nestjs/common';
import { PlayCombatService } from './play-combat.service';

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
}
