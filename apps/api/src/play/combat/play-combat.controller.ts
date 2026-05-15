import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PlayCombatService, StartCombatTeam } from './play-combat.service';

class StartCombatTeamEntityDto {
    @IsInt()
    entityId!: number;
}

class StartCombatTeamDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StartCombatTeamEntityDto)
    entities!: StartCombatTeamEntityDto[];
}

class StartCombatDto {
    @IsString()
    @IsNotEmpty()
    guildId!: string;

    @IsEnum(['spar', 'fight'])
    type!: 'spar' | 'fight';

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StartCombatTeamDto)
    teams!: StartCombatTeamDto[];
}

@Controller('play/combat')
export class PlayCombatController {
    constructor(private readonly service: PlayCombatService) {}

    @Get('invite-targets')
    getInviteTargets(
        @Query('guildId')           guildId:           string,
        @Query('initiatorEntityId', ParseIntPipe) initiatorEntityId: number,
        @Query('mode')              mode:              'spar' | 'fight',
    ) {
        return this.service.findInviteTargets(guildId, initiatorEntityId, mode);
    }

    @Get('signup-targets')
    getSignupTargets(
        @Query('guildId')            guildId:            string,
        @Query('userId')             userId:             string,
        @Query('initiatorFactionId', ParseIntPipe) initiatorFactionId: number,
        @Query('mode')               mode:               'spar' | 'fight',
    ) {
        return this.service.findSignupTargets(guildId, userId, initiatorFactionId, mode);
    }

    @Post('start')
    @HttpCode(HttpStatus.OK)
    startCombat(@Body() dto: StartCombatDto) {
        return this.service.startCombat(dto.guildId, dto.type, dto.teams as StartCombatTeam[]);
    }

    @Get(':id/participants')
    getParticipants(@Param('id', ParseIntPipe) id: number) {
        return this.service.getParticipants(id);
    }

    @Get(':id/available-actions')
    getAvailableActions(
        @Param('id', ParseIntPipe) id:       number,
        @Query('entityId', ParseIntPipe) entityId: number,
        @Query('category')         category: 'main' | 'bonus' | 'item',
    ) {
        return this.service.getAvailableActions(id, entityId, category);
    }

    @Post(':id/advance-turn')
    @HttpCode(HttpStatus.OK)
    advanceTurn(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { currentEntityId: number },
    ) {
        return this.service.advanceTurn(id, body.currentEntityId);
    }

    @Post(':id/process-builtin-action')
    @HttpCode(HttpStatus.OK)
    processBuiltinAction(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { actorEntityId: number; action: 'dodge' | 'help'; targetEntityId: number | null; roundNumber: number },
    ) {
        return this.service.processBuiltinAction(id, body.actorEntityId, body.action, body.targetEntityId ?? null, body.roundNumber);
    }

    @Post(':id/process-action')
    @HttpCode(HttpStatus.OK)
    processAction(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { actorEntityId: number; profileId: number; storedItemId: number; targetEntityId: number | null; roundNumber: number },
    ) {
        return this.service.processAction(id, body.actorEntityId, body.profileId, body.storedItemId, body.targetEntityId ?? null, body.roundNumber);
    }

    @Post(':id/distribute-xp')
    @HttpCode(HttpStatus.OK)
    distributeCombatXp(@Param('id', ParseIntPipe) id: number) {
        return this.service.distributeCombatXp(id);
    }

    @Post(':id/mark-deceased')
    @HttpCode(HttpStatus.OK)
    markDeceased(
        @Param('id', ParseIntPipe) _id:  number,
        @Body()                    body: { entityId: number },
    ) {
        return this.service.markDeceased(body.entityId);
    }

    @Post(':id/flee')
    @HttpCode(HttpStatus.OK)
    flee(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { entityId: number },
    ) {
        return this.service.flee(id, body.entityId);
    }

    @Post(':id/join')
    @HttpCode(HttpStatus.OK)
    joinCombat(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { entityId: number; allyFactionId: number; roundNumber: number },
    ) {
        return this.service.joinCombat(id, body.entityId, body.allyFactionId, body.roundNumber);
    }

    @Post(':id/process-reaction')
    @HttpCode(HttpStatus.OK)
    processReaction(
        @Param('id', ParseIntPipe) id:   number,
        @Body()                    body: { defenderEntityId: number; profileId: number; storedItemId: number; attackerEntityId: number; roundNumber: number },
    ) {
        return this.service.processReaction(id, body.defenderEntityId, body.profileId, body.storedItemId, body.attackerEntityId, body.roundNumber);
    }
}
