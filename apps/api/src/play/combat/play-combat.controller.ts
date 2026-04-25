import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { PlayCombatService, StartCombatTeam } from './play-combat.service';

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
        return this.service.findInviteTargets(guildId, parseInt(initiatorEntityId, 10), mode);
    }

    @Get('signup-targets')
    getSignupTargets(
        @Query('guildId')            guildId:            string,
        @Query('userId')             userId:             string,
        @Query('initiatorFactionId') initiatorFactionId: string,
        @Query('mode')               mode:               'spar' | 'fight',
    ) {
        return this.service.findSignupTargets(guildId, userId, parseInt(initiatorFactionId, 10), mode);
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

    @Post(':id/process-action')
    @HttpCode(HttpStatus.OK)
    processAction(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { actorEntityId: number; profileId: number; storedItemId: number; targetEntityId: number | null; roundNumber: number },
    ) {
        if (!body?.actorEntityId || !body?.profileId || !body?.storedItemId || body?.roundNumber === undefined) {
            throw new BadRequestException('actorEntityId, profileId, storedItemId, and roundNumber are required');
        }
        return this.service.processAction(id, body.actorEntityId, body.profileId, body.storedItemId, body.targetEntityId ?? null, body.roundNumber);
    }

    @Post(':id/distribute-xp')
    @HttpCode(HttpStatus.OK)
    distributeCombatXp(@Param('id', ParseIntPipe) id: number) {
        return this.service.distributeCombatXp(id);
    }

    @Post(':id/second-wind')
    @HttpCode(HttpStatus.OK)
    acceptSecondWind(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { entityId: number },
    ) {
        if (!body?.entityId) throw new BadRequestException('entityId is required');
        return this.service.acceptSecondWind(id, body.entityId);
    }

    @Post(':id/decline-second-wind')
    @HttpCode(HttpStatus.OK)
    declineSecondWind(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { entityId: number },
    ) {
        if (!body?.entityId) throw new BadRequestException('entityId is required');
        return this.service.declineSecondWind(id, body.entityId);
    }

    @Post(':id/flee')
    @HttpCode(HttpStatus.OK)
    flee(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { entityId: number },
    ) {
        if (!body?.entityId) throw new BadRequestException('entityId is required');
        return this.service.flee(id, body.entityId);
    }

    @Post(':id/process-reaction')
    @HttpCode(HttpStatus.OK)
    processReaction(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { defenderEntityId: number; profileId: number; storedItemId: number; attackerEntityId: number; roundNumber: number },
    ) {
        if (!body?.defenderEntityId || !body?.profileId || !body?.storedItemId || !body?.attackerEntityId || body?.roundNumber === undefined) {
            throw new BadRequestException('defenderEntityId, profileId, storedItemId, attackerEntityId, and roundNumber are required');
        }
        return this.service.processReaction(id, body.defenderEntityId, body.profileId, body.storedItemId, body.attackerEntityId, body.roundNumber);
    }
}
