import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { errorCodes } from '@echoengine/shared';
import { CreateDenDto } from './dto/create-den.dto';
import { UpdateDenDto } from './dto/update-den.dto';
import { UpdateGuildSettingsDto } from './dto/update-guild-settings.dto';
import { ResetGuildSettingsDto } from './dto/reset-guild-settings.dto';
import { ServerRepository } from './server.repository';

const GUILD_SETTINGS_DEFAULTS = {
    defaultDailyEnergy:          100,
    doubleAgeMaxThreshold:       0,
    maxCombatRounds:             50,
    defaultProficiencyBonus:     2,
    disciplineLevelCap:          null,
    factionRepDecayRate:         5,
    farmingSoilDegradationFilth: 0.02,
    farmingSoilDegradationToxic: 0.05,
    farmingCompostIncrement:     0.10,
    worldSimEnabled:    true,
    conditionsEnabled:  true,
    combatEnabled:      true,
    activitiesEnabled:  true,
    eventsEnabled:      true,
    craftingEnabled:    true,
    progressionEnabled: true,
    socialEnabled:      true,
} as const;

@Injectable()
export class ServerService {
    constructor(private readonly serverRepo: ServerRepository) {}

    async updateGuildSettings(dto: UpdateGuildSettingsDto) {
        const existing = await this.serverRepo.findGuildSettings(dto.guildId);

        if (!existing) {
            throw new NotFoundException({
                code: errorCodes.GUILD_SETTINGS_NOT_FOUND,
                message: 'This guild has no settings configured yet.',
            });
        }

        const { guildId, ...data } = dto;
        return this.serverRepo.updateGuildSettings(guildId, data);
    }

    async resetGuildSettings(dto: ResetGuildSettingsDto) {
        const existing = await this.serverRepo.findGuildSettings(dto.guildId);

        if (!existing) {
            throw new NotFoundException({
                code: errorCodes.GUILD_SETTINGS_NOT_FOUND,
                message: 'This guild has no settings configured yet.',
            });
        }

        return this.serverRepo.updateGuildSettings(dto.guildId, GUILD_SETTINGS_DEFAULTS);
    }

    async getGuildSettings(guildId: string) {
        const settings = await this.serverRepo.findGuildSettings(guildId);

        if (!settings) {
            throw new NotFoundException({
                code: errorCodes.GUILD_SETTINGS_NOT_FOUND,
                message: 'This guild has no settings configured yet.',
            });
        }

        return settings;
    }

    async removeDen(guildId: string, channelId: string) {
        const existing = await this.serverRepo.findDen(guildId, channelId);

        if (!existing) {
            throw new NotFoundException({
                code: errorCodes.DEN_NOT_FOUND,
                message: 'This channel is not a registered den.',
            });
        }

        return this.serverRepo.deleteDen(guildId, channelId);
    }

    async getDens(guildId: string) {
        return this.serverRepo.findDens(guildId);
    }

    async getDen(guildId: string, channelId: string) {
        const den = await this.serverRepo.findDen(guildId, channelId);

        if (!den) {
            throw new NotFoundException({
                code: errorCodes.DEN_NOT_FOUND,
                message: 'This channel is not a registered den.',
            });
        }

        return den;
    }

    async updateDen(dto: UpdateDenDto) {
        const existing = await this.serverRepo.findDen(dto.guildId, dto.channelId);

        if (!existing) {
            throw new NotFoundException({
                code: errorCodes.DEN_NOT_FOUND,
                message: 'This channel is not a registered den.',
            });
        }

        return this.serverRepo.updateDen(dto.guildId, dto.channelId, {
            allowWorldSim:    dto.allowWorldSim,
            allowConditions:  dto.allowConditions,
            allowCombat:      dto.allowCombat,
            allowActivities:  dto.allowActivities,
            allowEvents:      dto.allowEvents,
            allowCrafting:    dto.allowCrafting,
            allowProgression: dto.allowProgression,
            allowSocial:      dto.allowSocial,
        });
    }

    async createDen(dto: CreateDenDto) {
        const existing = await this.serverRepo.findDen(dto.guildId, dto.channelId);

        if (existing) {
            throw new ConflictException({
                code: errorCodes.DEN_ALREADY_EXISTS,
                message: 'This channel is already registered as an Echo Den.',
            });
        }

        const den = await this.serverRepo.createDen(dto.guildId, dto.channelId);

        const existingSettings = await this.serverRepo.findGuildSettings(dto.guildId);
        const firstTimeSetup = !existingSettings;
        if (firstTimeSetup) {
            await this.serverRepo.createGuildSettings(dto.guildId);
        }

        return { den, firstTimeSetup };
    }
}
