import { IsString } from 'class-validator';

export class WeatherTickDto {
    @IsString()
    guildId!: string;
}

export interface WeatherStateInfo {
    codeName:      string;
    name:          string;
    isSevere:      boolean;
    envConditions: string[];
}

export interface WeatherTickResult {
    skipped:             boolean;
    reason?:             'world_sim_disabled' | 'no_season' | 'no_eligible_patterns';
    weatherChanged:      boolean;
    patternChanged:      boolean;
    currentWeatherState: WeatherStateInfo | null;
}

export interface TickAllResult {
    processed: number;
    results: Array<{
        guildId:        string;
        skipped:        boolean;
        reason?:        'world_sim_disabled' | 'no_season' | 'no_eligible_patterns';
        weatherChanged: boolean;
        patternChanged: boolean;
    }>;
}
