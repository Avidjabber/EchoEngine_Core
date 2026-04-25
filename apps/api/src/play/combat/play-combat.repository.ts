import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';

export interface StartCombatTeamEntity {
    entityId: number;
}

export interface StartCombatTeam {
    entities: StartCombatTeamEntity[];
}

export interface CombatParticipantOrder {
    entityId:      number;
    allyFactionId: number;
}

export type StartCombatResult =
    | { success: true;  activeCombatId: number; removedEntityIds: number[]; participants: CombatParticipantOrder[] }
    | { success: false;                          removedEntityIds: number[] };

export interface CombatParticipantInfo {
    entityId:       number;
    name:           string;
    userId:         string | null;
    allyFactionId:  number;
    turnOrder:      number;
    isDefeated:     boolean;
    hasFled:        boolean;
    isAiControlled: boolean;
}

export interface AvailableAction {
    profileId:    number;
    storedItemId: number;
    itemName:     string;
    actionLabel:  string | null;
    targetScope: {
        targetsSelf:    boolean;
        targetsSingle:  boolean;
        targetsAllies:  boolean;
        targetsEnemies: boolean;
    } | null;
    damageDice:   string | null;
    healDice:     string | null;
    isOnCooldown: boolean;
}

export interface AdvanceTurnResult {
    combatEnded:          boolean;
    nextEntityId:         number | null;
    nextEntityName:       string | null;
    nextUserId:           string | null;
    isAiControlled:       boolean;
    round:                number;
    winningAllyFactionId: number | null;
}

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
            select: { entityId: true, currentEnergy: true, dexterity: true },
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

        // Roll initiative: d20 + floor((dex - 10) / 2)
        // Tie-break 1: higher raw dex; tie-break 2: random
        const dexByEntity = new Map(statsRows.map(r => [r.entityId, r.dexterity]));
        const participants = eligibleTeams.flatMap((team, teamIdx) =>
            team.entities.map(e => {
                const dex      = dexByEntity.get(e.entityId) ?? 10;
                const modifier = Math.floor((dex - 10) / 2);
                const roll     = Math.floor(Math.random() * 20) + 1 + modifier;
                return { entityId: e.entityId, allyFactionId: teamIdx + 1, initiativeRoll: roll };
            }),
        );
        participants.sort((a, b) =>
            b.initiativeRoll - a.initiativeRoll ||
            (dexByEntity.get(b.entityId) ?? 10) - (dexByEntity.get(a.entityId) ?? 10) ||
            Math.random() - 0.5,
        );

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

        return {
            success:       true,
            activeCombatId: combat.id,
            removedEntityIds,
            participants:  participants.map(p => ({ entityId: p.entityId, allyFactionId: p.allyFactionId })),
        };
    }

    async getParticipants(combatId: number): Promise<CombatParticipantInfo[]> {
        const rows = await this.db.activeCombat_Participant.findMany({
            where:   { activeCombatId: combatId },
            select: {
                entityId:      true,
                allyFactionId: true,
                turnOrder:     true,
                isDefeated:    true,
                hasFled:       true,
                isAiControlled: true,
                entity: { select: { name: true, userId: true } },
            },
            orderBy: { turnOrder: 'asc' },
        });
        return rows.map(r => ({
            entityId:      r.entityId,
            name:          r.entity.name,
            userId:        r.entity.userId ?? null,
            allyFactionId: r.allyFactionId,
            turnOrder:     r.turnOrder,
            isDefeated:    r.isDefeated,
            hasFled:       r.hasFled,
            isAiControlled: r.isAiControlled,
        }));
    }

    async getAvailableActions(
        combatId:  number,
        entityId:  number,
        category:  'main' | 'bonus' | 'item',
    ): Promise<AvailableAction[]> {
        const categoryNameMap: Record<'main' | 'bonus' | 'item', string> = {
            main:  'Main Action',
            bonus: 'Bonus Action',
            item:  'Item Interaction',
        };
        const categoryName = categoryNameMap[category];

        const combat = await this.db.activeCombat.findUnique({
            where:  { id: combatId },
            select: {
                initiationType: { select: { name: true } },
                participants: {
                    where:  { entityId },
                    select: { id: true },
                },
            },
        });
        if (!combat) return [];

        const participantId = combat.participants[0]?.id;
        const isSpar        = combat.initiationType.name === 'spar';

        // Get cooldowns for this participant
        const cooldowns = participantId
            ? await this.db.activeCombat_Participant_ActionCooldown.findMany({
                where:  { participantId },
                select: { equipmentProfileId: true },
            })
            : [];
        const cooldownProfileIds = new Set(cooldowns.map(c => c.equipmentProfileId));

        // Find entity storage
        const entityStorage = await this.db.entity_Storage.findUnique({
            where:  { entityId },
            select: { storageId: true },
        });
        if (!entityStorage) return [];

        if (category === 'item') {
            // Items in inventory with any profile in the "Item Interaction" category (not required to be equipped)
            const items = await this.db.storedItem.findMany({
                where: {
                    storageId: entityStorage.storageId,
                    item: {
                        equipmentProfiles: {
                            some: {
                                actionCategory: { name: categoryName },
                                ...(isSpar ? { allowedInSpar: true } : {}),
                            },
                        },
                    },
                },
                select: {
                    id:               true,
                    usesRemaining:    true,
                    dailyUsesRemaining: true,
                    item: {
                        select: {
                            name:              true,
                            equipmentProfiles: {
                                where: {
                                    actionCategory: { name: categoryName },
                                    ...(isSpar ? { allowedInSpar: true } : {}),
                                },
                                select: {
                                    id:          true,
                                    label:       true,
                                    targetScope: { select: { targetsSelf: true, targetsSingle: true, targetsAllies: true, targetsEnemies: true } },
                                    damageDiceCount: true,
                                    damageDiceSides: true,
                                    healDiceCount:   true,
                                    healDiceSides:   true,
                                },
                            },
                        },
                    },
                },
            });

            const actions: AvailableAction[] = [];
            for (const stored of items) {
                if (stored.usesRemaining !== null && stored.usesRemaining <= 0) continue;
                if (stored.dailyUsesRemaining !== null && stored.dailyUsesRemaining <= 0) continue;
                for (const profile of stored.item.equipmentProfiles) {
                    actions.push({
                        profileId:    profile.id,
                        storedItemId: stored.id,
                        itemName:     stored.item.name,
                        actionLabel:  profile.label,
                        targetScope:  profile.targetScope,
                        damageDice:   profile.damageDiceCount ? `${profile.damageDiceCount}d${profile.damageDiceSides}` : null,
                        healDice:     profile.healDiceCount   ? `${profile.healDiceCount}d${profile.healDiceSides}`     : null,
                        isOnCooldown: cooldownProfileIds.has(profile.id),
                    });
                }
            }
            return actions;
        }

        // Main / Bonus: equipped items whose chosen profile is in the right category
        const equipped = await this.db.storedItem.findMany({
            where: {
                storageId:       entityStorage.storageId,
                isEquipped:      true,
                chosenProfile: {
                    actionCategory: { name: categoryName },
                    ...(isSpar ? { allowedInSpar: true } : {}),
                },
            },
            select: {
                id:   true,
                item: { select: { name: true } },
                chosenProfile: {
                    select: {
                        id:          true,
                        label:       true,
                        targetScope: { select: { targetsSelf: true, targetsSingle: true, targetsAllies: true, targetsEnemies: true } },
                        damageDiceCount: true,
                        damageDiceSides: true,
                        healDiceCount:   true,
                        healDiceSides:   true,
                    },
                },
            },
        });

        return equipped
            .filter(s => s.chosenProfile !== null)
            .map(s => ({
                profileId:    s.chosenProfile!.id,
                storedItemId: s.id,
                itemName:     s.item.name,
                actionLabel:  s.chosenProfile!.label,
                targetScope:  s.chosenProfile!.targetScope,
                damageDice:   s.chosenProfile!.damageDiceCount
                    ? `${s.chosenProfile!.damageDiceCount}d${s.chosenProfile!.damageDiceSides}`
                    : null,
                healDice:     s.chosenProfile!.healDiceCount
                    ? `${s.chosenProfile!.healDiceCount}d${s.chosenProfile!.healDiceSides}`
                    : null,
                isOnCooldown: cooldownProfileIds.has(s.chosenProfile!.id),
            }));
    }

    async advanceTurn(combatId: number, currentEntityId: number): Promise<AdvanceTurnResult> {
        const combat = await this.db.activeCombat.findUnique({
            where:  { id: combatId },
            select: {
                currentTurnOrder: true,
                currentRound:     true,
                participants: {
                    where:   { hasFled: false, isDefeated: false },
                    select: {
                        entityId:      true,
                        allyFactionId: true,
                        turnOrder:     true,
                        isAiControlled: true,
                        entity: { select: { name: true, userId: true } },
                    },
                    orderBy: { turnOrder: 'asc' },
                },
            },
        });
        if (!combat) throw new Error(`Combat ${combatId} not found`);

        const active = combat.participants;

        // Check if combat is over: fewer than 2 distinct ally factions remain
        const factions = new Set(active.map(p => p.allyFactionId));
        if (factions.size < 2) {
            const winningAllyFactionId = factions.size === 1 ? [...factions][0] : null;
            await this.db.activeCombat.update({
                where: { id: combatId },
                data:  { isActive: false },
            });
            return { combatEnded: true, nextEntityId: null, nextEntityName: null, nextUserId: null, isAiControlled: false, round: combat.currentRound, winningAllyFactionId };
        }

        const currentIdx = active.findIndex(p => p.entityId === currentEntityId);
        const nextIdx    = (currentIdx + 1) % active.length;
        const next       = active[nextIdx]!;

        let newRound = combat.currentRound;
        if (nextIdx <= currentIdx) newRound++;

        await this.db.activeCombat.update({
            where: { id: combatId },
            data:  { currentTurnOrder: next.turnOrder, currentRound: newRound },
        });

        return {
            combatEnded:          false,
            nextEntityId:         next.entityId,
            nextEntityName:       next.entity.name,
            nextUserId:           next.entity.userId ?? null,
            isAiControlled:       next.isAiControlled,
            round:                newRound,
            winningAllyFactionId: null,
        };
    }

    private async _getActionEnergyCost(guildId: string, mode: 'spar' | 'fight'): Promise<number> {
        const config = await this.db.guild_ActionConfig.findFirst({
            where:  { guildId, actionType: { name: mode } },
            select: { energyCost: true },
        });
        return config?.energyCost ?? 0;
    }
}
