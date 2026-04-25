import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

export interface StartCombatTeamEntity {
    entityId: number;
}

export interface StartCombatTeam {
    entities: StartCombatTeamEntity[];
}

export type StartCombatResult =
    | { success: true;  activeCombatId: number; removedEntityIds: number[] }
    | { success: false;                          removedEntityIds: number[] };

export interface CombatTargetEntity {
    id:          number;
    name:        string;
    age:         number;
    factionId:   number;
    factionName: string;
    userId:      string;
}

@Injectable()
export class PlayCombatRepository {
    constructor(private readonly db: PrimaryDatabaseService) {}

    async findInviteTargets(
        guildId:           string,
        initiatorEntityId: number,
        mode:              'spar' | 'fight',
    ): Promise<CombatTargetEntity[]> {
        const initiator = await this.db.entity.findUnique({
            where:  { id: initiatorEntityId },
            select: { userId: true, factionId: true },
        });
        if (!initiator?.userId) return [];

        const energyCost = await this._getActionEnergyCost(guildId, mode);

        const rows = await this.db.entity.findMany({
            where: {
                guildId,
                isDeceased: false,
                userId:     { not: initiator.userId },
                type:       { name: 'Main Character' },
                ...(mode === 'spar' ? { factionId: initiator.factionId } : {}),
                stats: { currentEnergy: { gte: energyCost } },
            },
            select: {
                id:      true,
                name:    true,
                age:     true,
                userId:  true,
                faction: { select: { id: true, name: true } },
            },
            orderBy: { name: 'asc' },
        });

        return rows.map(r => ({
            id:          r.id,
            name:        r.name,
            age:         r.age,
            factionId:   r.faction!.id,
            factionName: r.faction!.name,
            userId:      r.userId!,
        }));
    }

    async findSignupTargets(
        guildId:           string,
        userId:            string,
        initiatorFactionId: number,
        mode:              'spar' | 'fight',
    ): Promise<CombatTargetEntity[]> {
        const energyCost = await this._getActionEnergyCost(guildId, mode);

        const rows = await this.db.entity.findMany({
            where: {
                guildId,
                userId,
                isDeceased: false,
                type:       { name: 'Main Character' },
                ...(mode === 'spar' ? { factionId: initiatorFactionId } : {}),
                stats: { currentEnergy: { gte: energyCost } },
            },
            select: {
                id:      true,
                name:    true,
                age:     true,
                userId:  true,
                faction: { select: { id: true, name: true } },
            },
            orderBy: { name: 'asc' },
        });

        return rows.map(r => ({
            id:          r.id,
            name:        r.name,
            age:         r.age,
            factionId:   r.faction!.id,
            factionName: r.faction!.name,
            userId:      r.userId!,
        }));
    }

    async startCombat(
        guildId: string,
        type:    'spar' | 'fight',
        teams:   StartCombatTeam[],
    ): Promise<StartCombatResult> {
        const energyCost    = await this._getActionEnergyCost(guildId, type);
        const allEntityIds  = teams.flatMap(t => t.entities.map(e => e.entityId));

        const statsRows = await this.db.entityStats.findMany({
            where:  { entityId: { in: allEntityIds } },
            select: { entityId: true, currentEnergy: true },
        });
        const energyMap = new Map(statsRows.map(r => [r.entityId, r.currentEnergy]));

        const removedEntityIds: number[] = [];
        const eligibleTeams = teams
            .map(team => ({
                entities: team.entities.filter(e => {
                    const ok = (energyMap.get(e.entityId) ?? 0) >= energyCost;
                    if (!ok) removedEntityIds.push(e.entityId);
                    return ok;
                }),
            }))
            .filter(t => t.entities.length > 0);

        if (eligibleTeams.length < 2) {
            return { success: false, removedEntityIds };
        }

        const initiationType = await this.db.combatInitiationType.findFirst({
            where:  { name: type },
            select: { id: true },
        });
        if (!initiationType) throw new Error(`Unknown CombatInitiationType: ${type}`);

        // Assign randomised turn order across all participants
        const participants = eligibleTeams.flatMap((team, teamIdx) =>
            team.entities.map(e => ({ entityId: e.entityId, allyFactionId: teamIdx + 1 })),
        );
        for (let i = participants.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [participants[i], participants[j]] = [participants[j], participants[i]];
        }

        const eligibleEntityIds = participants.map(p => p.entityId);

        const combat = await this.db.$transaction(async (tx) => {
            const created = await tx.activeCombat.create({
                data: {
                    guildId,
                    initiationTypeId: initiationType.id,
                    participants: {
                        create: participants.map((p, i) => ({
                            entityId:      p.entityId,
                            allyFactionId: p.allyFactionId,
                            turnOrder:     i + 1,
                        })),
                    },
                },
                select: { id: true },
            });

            if (energyCost > 0) {
                await tx.entityStats.updateMany({
                    where: { entityId: { in: eligibleEntityIds } },
                    data:  { currentEnergy: { decrement: energyCost } },
                });
            }

            return created;
        });

        return { success: true, activeCombatId: combat.id, removedEntityIds };
    }

    private async _getActionEnergyCost(guildId: string, mode: 'spar' | 'fight'): Promise<number> {
        const config = await this.db.guild_ActionConfig.findFirst({
            where:  { guildId, actionType: { name: mode } },
            select: { energyCost: true },
        });
        return config?.energyCost ?? 0;
    }
}
