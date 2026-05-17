import { Module } from '@nestjs/common';
import { ApiCacheService } from '../cache/api-cache.service';
import { EnvConditionsController } from './env-conditions/envConditions.controller';
import { EnvConditionsService } from './env-conditions/envConditions.service';
import { EnvConditionsRepository } from './env-conditions/envConditions.repository';
import { ProficienciesController } from './proficiencies/proficiencies.controller';
import { ProficienciesService } from './proficiencies/proficiencies.service';
import { ProficienciesRepository } from './proficiencies/proficiencies.repository';
import { ActionsController } from './actions/actions.controller';
import { ActionsService } from './actions/actions.service';
import { ActionsRepository } from './actions/actions.repository';
import { WeatherStatesController } from './weather-states/weatherStates.controller';
import { WeatherStatesService } from './weather-states/weatherStates.service';
import { WeatherStatesRepository } from './weather-states/weatherStates.repository';
import { WeatherPatternsController } from './weather-patterns/weatherPatterns.controller';
import { WeatherPatternsService } from './weather-patterns/weatherPatterns.service';
import { WeatherPatternsRepository } from './weather-patterns/weatherPatterns.repository';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';
import { ItemsRepository } from './items/items.repository';
import { ConditionsController } from './conditions/conditions.controller';
import { ConditionsService } from './conditions/conditions.service';
import { ConditionsRepository } from './conditions/conditions.repository';

@Module({
    controllers: [EnvConditionsController, ProficienciesController, ActionsController, WeatherStatesController, WeatherPatternsController, ItemsController, ConditionsController],
    providers:   [ApiCacheService, EnvConditionsService, EnvConditionsRepository, ProficienciesService, ProficienciesRepository, ActionsService, ActionsRepository, WeatherStatesService, WeatherStatesRepository, WeatherPatternsService, WeatherPatternsRepository, ItemsService, ItemsRepository, ConditionsService, ConditionsRepository],
})
export class ModelModule {}
