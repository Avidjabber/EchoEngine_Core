import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';

export class UpdateGuildSettingsDto {
    @IsString()
    @IsNotEmpty()
    declare guildId: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(9999)
    declare defaultDailyEnergy?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(9999)
    declare doubleAgeMaxThreshold?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(9999)
    declare maxCombatRounds?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(9999)
    declare defaultProficiencyBonus?: number;

    // null = no cap; omit field entirely to leave unchanged
    @IsOptional()
    @ValidateIf((o: UpdateGuildSettingsDto) => o.disciplineLevelCap !== null)
    @IsInt()
    @Min(0)
    @Max(9999)
    declare disciplineLevelCap?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(9999)
    declare factionRepDecayRate?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    declare farmingSoilDegradationFilth?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    declare farmingSoilDegradationToxic?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    declare farmingCompostIncrement?: number;

    @IsOptional()
    @IsBoolean()
    declare worldSimEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    declare conditionsEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    declare combatEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    declare activitiesEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    declare eventsEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    declare craftingEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    declare progressionEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    declare socialEnabled?: boolean;

    @IsOptional()
    @IsInt()
    @Min(-12)
    @Max(12)
    declare timezoneOffset?: number;
}
