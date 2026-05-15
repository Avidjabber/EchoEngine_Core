import { Module } from '@nestjs/common';
import { PlayEntitiesController } from './entities/play-entities.controller';
import { PlayEntitiesService } from './entities/play-entities.service';
import { PlayEntitiesRepository } from './entities/play-entities.repository';
import { PlayCombatController } from './combat/play-combat.controller';
import { PlayCombatService } from './combat/play-combat.service';

@Module({
    controllers: [PlayEntitiesController, PlayCombatController],
    providers:   [PlayEntitiesService, PlayEntitiesRepository, PlayCombatService],
})
export class PlayModule {}
