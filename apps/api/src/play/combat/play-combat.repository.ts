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
    currentHp:      number | null;
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
    damageDice:    string | null;
    healDice:      string | null;
    cooldownRounds: number;
    isOnCooldown:  boolean;
}

export interface ActionResult {
    actionId:         number;
    actionLabel:      string;
    actorName:        string;
    targetName:       string;
    actualTargetName: string;
    wasRedirected:    boolean;
    outcome:
        | { kind: 'hit';      hitRoll: number; targetAC: number; diceRolls: number[]; totalDamage: number; hpAfter: number; knockedDown: boolean; defeated: boolean }
        | { kind: 'miss';     hitRoll: number; targetAC: number }
        | { kind: 'heal';     diceRolls: number[]; totalHeal: number; hpAfter: number }
        | { kind: 'behavior'; effectName: string; guardedName: string | null; rounds: number }
        | { kind: 'no_op' };
}

export interface XpGrant {
    entityId:      number;
    entityName:    string;
    disciplineId:  number;
    disciplineName: string;
    xpGained:      number;
    levelsGained:  number;
    newLevel:      number;
}

export interface RoundEndEvent {
    kind:       'dot' | 'hot';
    entityId:   number;
    entityName: string;
    amount:     number;
    hpAfter:    number;
    defeated:   boolean;
}

export interface AdvanceTurnResult {
    combatEnded:            boolean;
    turnEndEvents:          RoundEndEvent[];
    nextEntityId:           number | null;
    nextEntityName:         string | null;
    nextUserId:             string | null;
    isAiControlled:         boolean;
    isAwaitingSecondWind:   boolean;
    round:                  number;
    winningAllyFactionId:   number | null;
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
                entityId:         true,
                allyFactionId:    true,
                turnOrder:        true,
                isDefeated:       true,
                hasFled:          true,
                isAiControlled:   true,
                controllerUserId: true,
                entity: {
                    select: {
                        name:   true,
                        userId: true,
                        stats:  { select: { currentHp: true } },
                    },
                },
            },
            orderBy: { turnOrder: 'asc' },
        });
        return rows.map(r => ({
            entityId:       r.entityId,
            name:           r.entity.name,
            userId:         r.controllerUserId ?? r.entity.userId ?? null,
            allyFactionId:  r.allyFactionId,
            turnOrder:      r.turnOrder,
            currentHp:      r.entity.stats?.currentHp ?? null,
            isDefeated:     r.isDefeated,
            hasFled:        r.hasFled,
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

        const profileSelect = {
            id:              true,
            label:           true,
            cooldownRounds:  true,
            targetScope:     { select: { targetsSelf: true, targetsSingle: true, targetsAllies: true, targetsEnemies: true } },
            damageDiceCount: true,
            damageDiceSides: true,
            healDiceCount:   true,
            healDiceSides:   true,
        } as const;

        const profileWhere = {
            actionCategory: { name: categoryName },
            usageContext:   { not: 'out_of_combat_only' },
            ...(isSpar ? { allowedInSpar: true } : {}),
        } as const;

        if (category === 'item') {
            // Items in inventory with any profile in the "Item Interaction" category (not required to be equipped)
            const items = await this.db.storedItem.findMany({
                where: {
                    storageId: entityStorage.storageId,
                    item: { equipmentProfiles: { some: profileWhere } },
                },
                select: {
                    id:                 true,
                    usesRemaining:      true,
                    dailyUsesRemaining: true,
                    item: {
                        select: {
                            name:              true,
                            equipmentProfiles: { where: profileWhere, select: profileSelect },
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
                        profileId:      profile.id,
                        storedItemId:   stored.id,
                        itemName:       stored.item.name,
                        actionLabel:    profile.label,
                        targetScope:    profile.targetScope,
                        damageDice:     profile.damageDiceCount ? `${profile.damageDiceCount}d${profile.damageDiceSides}` : null,
                        healDice:       profile.healDiceCount   ? `${profile.healDiceCount}d${profile.healDiceSides}`     : null,
                        cooldownRounds: profile.cooldownRounds,
                        isOnCooldown:   cooldownProfileIds.has(profile.id),
                    });
                }
            }
            return actions;
        }

        // Main / Bonus: equipped items whose chosen profile is in the right category
        const equipped = await this.db.storedItem.findMany({
            where: {
                storageId:     entityStorage.storageId,
                isEquipped:    true,
                chosenProfile: profileWhere,
            },
            select: {
                id:   true,
                item: { select: { name: true } },
                chosenProfile: { select: profileSelect },
            },
        });

        return equipped
            .filter(s => s.chosenProfile !== null)
            .map(s => ({
                profileId:      s.chosenProfile!.id,
                storedItemId:   s.id,
                itemName:       s.item.name,
                actionLabel:    s.chosenProfile!.label,
                targetScope:    s.chosenProfile!.targetScope,
                damageDice:     s.chosenProfile!.damageDiceCount
                    ? `${s.chosenProfile!.damageDiceCount}d${s.chosenProfile!.damageDiceSides}`
                    : null,
                healDice:       s.chosenProfile!.healDiceCount
                    ? `${s.chosenProfile!.healDiceCount}d${s.chosenProfile!.healDiceSides}`
                    : null,
                cooldownRounds: s.chosenProfile!.cooldownRounds,
                isOnCooldown:   cooldownProfileIds.has(s.chosenProfile!.id),
            }));
    }

    async advanceTurn(combatId: number, currentEntityId: number): Promise<AdvanceTurnResult> {
        const combat = await this.db.activeCombat.findUnique({
            where:  { id: combatId },
            select: {
                currentTurnOrder:  true,
                currentRound:      true,
                initiationType:    { select: { canSecondWind: true } },
                participants: {
                    where:   { hasFled: false, isDefeated: false },
                    select: {
                        entityId:         true,
                        allyFactionId:    true,
                        turnOrder:        true,
                        isAiControlled:   true,
                        inSecondWind:     true,
                        controllerUserId: true,
                        entity: {
                            select: {
                                name:   true,
                                userId: true,
                                stats:  { select: { currentHp: true } },
                            },
                        },
                    },
                    orderBy: { turnOrder: 'asc' },
                },
            },
        });
        if (!combat) throw new Error(`Combat ${combatId} not found`);

        const active        = combat.participants;
        const canSecondWind = combat.initiationType.canSecondWind;

        // Track round boundary (for global timeout counter only — does not drive effect expiry)
        const currentIdx    = active.findIndex(p => p.entityId === currentEntityId);
        const nextIdx       = active.length > 0 ? (currentIdx + 1) % active.length : 0;
        const roundBoundary = active.length > 0 && nextIdx <= currentIdx;

        let newRound = combat.currentRound;
        if (roundBoundary) newRound++;

        // Fire DoT/HoT for effects sourced by the ending participant; decrement their stat effects
        // and cooldowns. This fires on the same turn the effect was applied (durationRounds = 1
        // fires once here, then the effect is deleted).
        const endingParticipant = active.find(p => p.entityId === currentEntityId);
        const turnEndEvents = endingParticipant
            ? await this._processTurnEnd(combatId, endingParticipant.id, canSecondWind)
            : [];

        // Reload participants — DoT may have changed isDefeated states
        type ParticipantRow = typeof active[0];
        const freshActive: ParticipantRow[] = await this.db.activeCombat_Participant.findMany({
            where:   { activeCombatId: combatId, hasFled: false, isDefeated: false },
            select: {
                entityId:         true,
                allyFactionId:    true,
                turnOrder:        true,
                isAiControlled:   true,
                inSecondWind:     true,
                controllerUserId: true,
                entity: {
                    select: {
                        name:   true,
                        userId: true,
                        stats:  { select: { currentHp: true } },
                    },
                },
            },
            orderBy: { turnOrder: 'asc' },
        });

        // Check if combat is over: fewer than 2 distinct ally factions remain
        const factions = new Set(freshActive.map(p => p.allyFactionId));
        if (factions.size < 2) {
            const winningAllyFactionId = factions.size === 1 ? [...factions][0]! : null;
            const outcomeName = winningAllyFactionId !== null ? 'win' : 'draw';
            const outcome = await this.db.combatOutcome.findFirst({ where: { name: outcomeName }, select: { id: true } });
            await this.db.activeCombat.update({
                where: { id: combatId },
                data:  { isActive: false, winningAllyFactionId: winningAllyFactionId ?? null, ...(outcome ? { outcomeId: outcome.id } : {}), completedAt: new Date() },
            });
            return { combatEnded: true, turnEndEvents, nextEntityId: null, nextEntityName: null, nextUserId: null, isAiControlled: false, isAwaitingSecondWind: false, round: newRound, winningAllyFactionId };
        }

        // Find next participant by turn order: first with turnOrder > current's, else wrap to first
        const currentTurnOrder = active.find(p => p.entityId === currentEntityId)?.turnOrder ?? 0;
        const next = freshActive.find(p => p.turnOrder > currentTurnOrder) ?? freshActive[0]!;

        // Decrement behavior effects sourced by the next participant at the start of their turn
        await this._processTurnStart(combatId, next.id);

        await this.db.activeCombat.update({
            where: { id: combatId },
            data:  { currentTurnOrder: next.turnOrder, currentRound: newRound },
        });

        const isAwaitingSecondWind =
            canSecondWind &&
            !next.isAiControlled &&
            !next.inSecondWind &&
            (next.entity.stats?.currentHp ?? 1) <= 0;

        return {
            combatEnded:          false,
            turnEndEvents,
            nextEntityId:         next.entityId,
            nextEntityName:       next.entity.name,
            nextUserId:           next.controllerUserId ?? next.entity.userId ?? null,
            isAiControlled:       next.isAiControlled,
            isAwaitingSecondWind,
            round:                newRound,
            winningAllyFactionId: null,
        };
    }

    // Fires at the end of a participant's turn.
    // Rolls DoT/HoT for all stat effects they sourced, decrements those effects, and decrements
    // their action cooldowns. A durationRounds = 1 effect fires here then is immediately deleted.
    private async _processTurnEnd(combatId: number, participantId: number, canSecondWind: boolean): Promise<RoundEndEvent[]> {
        const events: RoundEndEvent[] = [];
        const rollDice = (count: number, sides: number): number[] =>
            Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);

        // Load stat effects sourced by this participant, with DoT/HoT defs on affected targets
        const statEffects = await this.db.activeCombat_StatEffect.findMany({
            where: {
                activeCombatId:      combatId,
                sourceParticipantId: participantId,
                affectedParticipant: { isDefeated: false, hasFled: false },
            },
            select: {
                id:                    true,
                roundsRemaining:       true,
                affectedParticipantId: true,
                affectedParticipant: {
                    select: {
                        id:             true,
                        entityId:       true,
                        inSecondWind:   true,
                        isAiControlled: true,
                        entity: {
                            select: {
                                name:  true,
                                stats: { select: { currentHp: true, maxHp: true } },
                            },
                        },
                    },
                },
                effectDef: {
                    select: {
                        damageOverTime: { select: { diceCount: true, diceSides: true, flatDamage: true } },
                        healOverTime:   { select: { diceCount: true, diceSides: true, flatHeal: true } },
                    },
                },
            },
        });

        // Aggregate DoT and HoT per affected participant
        type ParticipantInfo = typeof statEffects[0]['affectedParticipant'];
        const participantById  = new Map<number, ParticipantInfo>();
        const dotByParticipant = new Map<number, number>();
        const hotByParticipant = new Map<number, number>();

        for (const effect of statEffects) {
            const p = effect.affectedParticipant;
            participantById.set(p.id, p);
            for (const dot of effect.effectDef.damageOverTime) {
                const total = rollDice(dot.diceCount, dot.diceSides).reduce((a, b) => a + b, 0) + dot.flatDamage;
                dotByParticipant.set(p.id, (dotByParticipant.get(p.id) ?? 0) + total);
            }
            for (const hot of effect.effectDef.healOverTime) {
                const total = rollDice(hot.diceCount, hot.diceSides).reduce((a, b) => a + b, 0) + hot.flatHeal;
                hotByParticipant.set(p.id, (hotByParticipant.get(p.id) ?? 0) + total);
            }
        }

        // Track running HP to chain HoT → DoT on the same target
        const hpSnapshot = new Map<number, number>();
        for (const [pid, p] of participantById) {
            hpSnapshot.set(pid, p.entity.stats?.currentHp ?? 0);
        }

        // Apply HoT first
        for (const [targetParticipantId, heal] of hotByParticipant) {
            const p     = participantById.get(targetParticipantId)!;
            const maxHp = p.entity.stats?.maxHp ?? (hpSnapshot.get(targetParticipantId) ?? 0);
            const newHp = Math.min(maxHp, (hpSnapshot.get(targetParticipantId) ?? 0) + heal);
            hpSnapshot.set(targetParticipantId, newHp);
            await this.db.entityStats.update({ where: { entityId: p.entityId }, data: { currentHp: newHp } });
            events.push({ kind: 'hot', entityId: p.entityId, entityName: p.entity.name, amount: heal, hpAfter: newHp, defeated: false });
        }

        // Apply DoT
        for (const [targetParticipantId, damage] of dotByParticipant) {
            const p     = participantById.get(targetParticipantId)!;
            const newHp = (hpSnapshot.get(targetParticipantId) ?? 0) - damage;
            hpSnapshot.set(targetParticipantId, newHp);
            await this.db.entityStats.update({ where: { entityId: p.entityId }, data: { currentHp: newHp } });
            let defeated = false;
            if (newHp <= 0 && (p.isAiControlled || !canSecondWind || p.inSecondWind)) {
                await this.db.activeCombat_Participant.update({
                    where: { id: targetParticipantId },
                    data:  { isDefeated: true },
                });
                defeated = true;
            }
            // If HP ≤ 0 and second wind is available: leave HP at newHp;
            // advanceTurn detects isAwaitingSecondWind when it's their next turn.
            events.push({ kind: 'dot', entityId: p.entityId, entityName: p.entity.name, amount: damage, hpAfter: Math.max(0, newHp), defeated });
        }

        // Decrement stat effects sourced by this participant (delete at 1 → fires this turn then gone)
        await this.db.$transaction([
            this.db.activeCombat_StatEffect.deleteMany({
                where: { activeCombatId: combatId, sourceParticipantId: participantId, roundsRemaining: 1 },
            }),
            this.db.activeCombat_StatEffect.updateMany({
                where: { activeCombatId: combatId, sourceParticipantId: participantId, roundsRemaining: { gt: 1 } },
                data:  { roundsRemaining: { decrement: 1 } },
            }),
            // Decrement this participant's action cooldowns
            this.db.activeCombat_Participant_ActionCooldown.deleteMany({
                where: { participantId, roundsRemaining: 1 },
            }),
            this.db.activeCombat_Participant_ActionCooldown.updateMany({
                where: { participantId, roundsRemaining: { gt: 1 } },
                data:  { roundsRemaining: { decrement: 1 } },
            }),
        ]);

        return events;
    }

    // Fires at the start of a participant's turn.
    // Decrements behavior effects they sourced, deleting any that reach 0.
    private async _processTurnStart(combatId: number, participantId: number): Promise<void> {
        await this.db.$transaction([
            this.db.activeCombat_BehaviorEffect.deleteMany({
                where: { activeCombatId: combatId, sourceParticipantId: participantId, roundsRemaining: 1 },
            }),
            this.db.activeCombat_BehaviorEffect.updateMany({
                where: { activeCombatId: combatId, sourceParticipantId: participantId, roundsRemaining: { gt: 1 } },
                data:  { roundsRemaining: { decrement: 1 } },
            }),
        ]);
    }

    async acceptSecondWind(combatId: number, entityId: number): Promise<void> {
        const stats = await this.db.entityStats.findUnique({
            where:  { entityId },
            select: { maxHp: true },
        });
        await this.db.$transaction([
            this.db.entityStats.update({
                where: { entityId },
                data:  { currentHp: stats?.maxHp ?? 1 },
            }),
            this.db.activeCombat_Participant.update({
                where: { activeCombatId_entityId: { activeCombatId: combatId, entityId } },
                data:  { inSecondWind: true },
            }),
        ]);
    }

    async declineSecondWind(combatId: number, entityId: number): Promise<void> {
        await this.db.activeCombat_Participant.update({
            where: { activeCombatId_entityId: { activeCombatId: combatId, entityId } },
            data:  { isDefeated: true },
        });
    }

    async processAction(
        combatId:       number,
        actorEntityId:  number,
        profileId:      number,
        storedItemId:   number,
        targetEntityId: number | null,
        roundNumber:    number,
    ): Promise<ActionResult> {
        // ── Load profile, combat, and actor in parallel ───────────────────────
        const [profile, combat, actor, existingCount] = await Promise.all([
            this.db.itemEquipmentProfile.findUnique({
                where:  { id: profileId },
                select: {
                    label:               true,
                    actionCategoryId:    true,
                    cooldownRounds:      true,
                    durationRounds:      true,
                    hitBonus:            true,
                    damageBonus:         true,
                    healBonus:           true,
                    damageDiceCount:     true,
                    damageDiceSides:     true,
                    healDiceCount:       true,
                    healDiceSides:       true,
                    behaviorEffectTypeId: true,
                    hitStat:            { select: { name: true } },
                    damageStat:         { select: { name: true } },
                    healStat:           { select: { name: true } },
                    behaviorEffectType: { select: { name: true, redirectsDamage: true } },
                    actionType:         { select: { dealsDamage: true, restoresHealth: true } },
                },
            }),
            this.db.activeCombat.findUnique({
                where:  { id: combatId },
                select: { initiationType: { select: { canSecondWind: true } } },
            }),
            this.db.entity.findUnique({
                where:  { id: actorEntityId },
                select: {
                    name:  true,
                    stats: { select: { strength: true, dexterity: true, constitution: true, intelligence: true, wisdom: true, charisma: true } },
                },
            }),
            this.db.activeCombat_Action.count({ where: { activeCombatId: combatId, roundNumber } }),
        ]);

        if (!profile?.actionCategoryId) throw new Error(`Profile ${profileId} has no action category`);
        const canSecondWind = combat?.initiationType.canSecondWind ?? false;

        // ── Resolve redirect (guard) for harmful actions ──────────────────────
        const dealsDamage    = profile.actionType?.dealsDamage    ?? false;
        const restoresHealth = profile.actionType?.restoresHealth ?? false;

        let actualTargetId = targetEntityId;
        let wasRedirected  = false;

        if (targetEntityId !== null && dealsDamage) {
            const targetParticipant = await this.db.activeCombat_Participant.findFirst({
                where:  { activeCombatId: combatId, entityId: targetEntityId },
                select: { id: true },
            });
            if (targetParticipant) {
                const guard = await this.db.activeCombat_BehaviorEffect.findFirst({
                    where: {
                        activeCombatId:       combatId,
                        linkedParticipantId:  targetParticipant.id,
                        effectType: { redirectsDamage: true },
                    },
                    select: { affectedParticipant: { select: { entityId: true } } },
                });
                if (guard) {
                    actualTargetId = guard.affectedParticipant.entityId;
                    wasRedirected  = true;
                }
            }
        }

        // ── Load original target name if redirected ───────────────────────────
        const originalTargetName = wasRedirected && targetEntityId !== null
            ? (await this.db.entity.findUnique({ where: { id: targetEntityId }, select: { name: true } }))?.name ?? 'Unknown'
            : null;

        // ── Load actual target data ───────────────────────────────────────────
        let targetEntity: {
            name:    string;
            species: { baseAc: number } | null;
            stats:   { dexterity: number; currentHp: number | null; maxHp: number | null } | null;
            storage: { storageId: number } | null;
        } | null = null;

        let targetAC        = 10;
        let targetPartInfo: { id: number; inSecondWind: boolean; isAiControlled: boolean } | null = null;

        if (actualTargetId !== null) {
            [targetEntity, targetPartInfo] = await Promise.all([
                this.db.entity.findUnique({
                    where:  { id: actualTargetId },
                    select: {
                        name:    true,
                        species: { select: { baseAc: true } },
                        stats:   { select: { dexterity: true, currentHp: true, maxHp: true } },
                        storage: { select: { storageId: true } },
                    },
                }),
                this.db.activeCombat_Participant.findFirst({
                    where:  { activeCombatId: combatId, entityId: actualTargetId },
                    select: { id: true, inSecondWind: true, isAiControlled: true },
                }),
            ]);

            if (targetEntity?.storage && (dealsDamage || restoresHealth)) {
                const equipped = await this.db.storedItem.findMany({
                    where:  { storageId: targetEntity.storage.storageId, isEquipped: true },
                    select: { chosenProfile: { select: { acModifier: true } } },
                });
                const equippedAcBonus = equipped.reduce((s, i) => s + (i.chosenProfile?.acModifier ?? 0), 0);
                const dexMod = Math.floor(((targetEntity.stats?.dexterity ?? 10) - 10) / 2);
                targetAC = (targetEntity.species?.baseAc ?? 10) + dexMod + equippedAcBonus;
            }
        }

        // ── Helpers ───────────────────────────────────────────────────────────
        const rollDice = (count: number, sides: number): number[] =>
            Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
        const statMod = (v: number) => Math.floor((v - 10) / 2);
        const getStat = (name: string | undefined): number =>
            name && actor?.stats ? ((actor.stats as Record<string, number>)[name] ?? 10) : 10;

        // ── Action data for the log record ────────────────────────────────────
        const logData: {
            hitRoll?: number; hitModifier?: number; hit?: boolean;
            damageRoll?: number; damageModifier?: number; damageDealt?: number;
            healDealt?: number; secondWindTriggered?: boolean;
        } = {};

        // ── Resolve outcome ───────────────────────────────────────────────────
        let outcome: ActionResult['outcome'] = { kind: 'no_op' };

        if (dealsDamage && actualTargetId !== null && targetEntity?.stats) {
            const hitMod  = statMod(getStat(profile.hitStat?.name)) + profile.hitBonus;
            const hitRoll = rollDice(1, 20)[0]!;
            const hitTotal = hitRoll + hitMod;
            const isHit   = hitTotal >= targetAC;

            logData.hitRoll = hitRoll; logData.hitModifier = hitMod; logData.hit = isHit;

            if (isHit && profile.damageDiceCount && profile.damageDiceSides) {
                const damageMod  = statMod(getStat(profile.damageStat?.name)) + profile.damageBonus;
                const diceRolls  = rollDice(profile.damageDiceCount, profile.damageDiceSides);
                const diceSum    = diceRolls.reduce((a, b) => a + b, 0);
                const totalDamage = Math.max(0, diceSum + damageMod);
                const newHp      = (targetEntity.stats.currentHp ?? 0) - totalDamage;

                logData.damageRoll = diceSum; logData.damageModifier = damageMod; logData.damageDealt = totalDamage;

                await this.db.entityStats.update({ where: { entityId: actualTargetId }, data: { currentHp: newHp } });

                let knockedDown = false;
                let defeated    = false;
                if (newHp <= 0 && targetPartInfo) {
                    if (targetPartInfo.isAiControlled || !canSecondWind || targetPartInfo.inSecondWind) {
                        await this.db.activeCombat_Participant.update({
                            where: { id: targetPartInfo.id },
                            data:  { isDefeated: true },
                        });
                        defeated = true;
                    } else {
                        knockedDown = true;
                        logData.secondWindTriggered = true;
                    }
                }
                outcome = { kind: 'hit', hitRoll: hitTotal, targetAC, diceRolls, totalDamage, hpAfter: Math.max(0, newHp), knockedDown, defeated };
            } else {
                outcome = { kind: 'miss', hitRoll: hitTotal, targetAC };
            }

        } else if (restoresHealth && actualTargetId !== null && targetEntity?.stats && profile.healDiceCount && profile.healDiceSides) {
            const healMod   = statMod(getStat(profile.healStat?.name)) + profile.healBonus;
            const diceRolls = rollDice(profile.healDiceCount, profile.healDiceSides);
            const diceSum   = diceRolls.reduce((a, b) => a + b, 0);
            const totalHeal = Math.max(0, diceSum + healMod);
            const newHp     = Math.min(
                targetEntity.stats.maxHp ?? (targetEntity.stats.currentHp ?? 0),
                (targetEntity.stats.currentHp ?? 0) + totalHeal,
            );
            logData.healDealt = totalHeal;
            await this.db.entityStats.update({ where: { entityId: actualTargetId }, data: { currentHp: newHp } });
            outcome = { kind: 'heal', diceRolls, totalHeal, hpAfter: newHp };

        } else if (profile.behaviorEffectTypeId) {
            const rounds = Math.max(1, profile.durationRounds);
            const [actorPart, linkedPart] = await Promise.all([
                this.db.activeCombat_Participant.findFirst({ where: { activeCombatId: combatId, entityId: actorEntityId }, select: { id: true } }),
                targetEntityId !== null
                    ? this.db.activeCombat_Participant.findFirst({ where: { activeCombatId: combatId, entityId: targetEntityId }, select: { id: true } })
                    : null,
            ]);
            if (actorPart) {
                await this.db.activeCombat_BehaviorEffect.upsert({
                    where:  { affectedParticipantId_effectTypeId: { affectedParticipantId: actorPart.id, effectTypeId: profile.behaviorEffectTypeId } },
                    create: { activeCombatId: combatId, affectedParticipantId: actorPart.id, linkedParticipantId: linkedPart?.id ?? null, sourceParticipantId: actorPart.id, effectTypeId: profile.behaviorEffectTypeId, roundsRemaining: rounds },
                    update: { roundsRemaining: rounds, linkedParticipantId: linkedPart?.id ?? null },
                });
            }
            const guardedName = targetEntityId !== null && targetEntityId !== actorEntityId
                ? await this.db.entity.findUnique({ where: { id: targetEntityId }, select: { name: true } }).then(e => e?.name ?? null)
                : null;
            outcome = { kind: 'behavior', effectName: profile.behaviorEffectType?.name ?? 'effect', guardedName, rounds };
        }

        // ── Create action log record ──────────────────────────────────────────
        const action = await this.db.activeCombat_Action.create({
            data: {
                activeCombatId:     combatId,
                roundNumber,
                turnIndex:          existingCount + 1,
                actorEntityId,
                actionCategoryId:   profile.actionCategoryId,
                equipmentProfileId: profileId,
                targetEntityId:     actualTargetId ?? null,
                ...logData,
            },
            select: { id: true },
        });

        // ── Cooldown ──────────────────────────────────────────────────────────
        if (profile.cooldownRounds > 0) {
            const actorPart = await this.db.activeCombat_Participant.findUnique({
                where:  { activeCombatId_entityId: { activeCombatId: combatId, entityId: actorEntityId } },
                select: { id: true },
            });
            if (actorPart) {
                await this.db.activeCombat_Participant_ActionCooldown.upsert({
                    where:  { participantId_equipmentProfileId: { participantId: actorPart.id, equipmentProfileId: profileId } },
                    create: { participantId: actorPart.id, equipmentProfileId: profileId, roundsRemaining: profile.cooldownRounds },
                    update: { roundsRemaining: profile.cooldownRounds },
                });
            }
        }

        // ── Decrement item uses ───────────────────────────────────────────────
        await this.db.storedItem.updateMany({
            where: {
                id:                    storedItemId,
                usesRemaining:         { not: null },
            },
            data: { usesRemaining: { decrement: 1 } },
        });
        await this.db.storedItem.updateMany({
            where: {
                id:                    storedItemId,
                dailyUsesRemaining:    { not: null },
            },
            data: { dailyUsesRemaining: { decrement: 1 } },
        });

        return {
            actionId:         action.id,
            actionLabel:      profile.label ?? 'Unknown',
            actorName:        actor?.name ?? 'Unknown',
            targetName:       originalTargetName ?? targetEntity?.name ?? 'Unknown',
            actualTargetName: targetEntity?.name ?? 'Unknown',
            wasRedirected,
            outcome,
        };
    }

    async distributeCombatXp(combatId: number): Promise<XpGrant[]> {
        const combat = await this.db.activeCombat.findUnique({
            where:  { id: combatId },
            select: {
                guildId:              true,
                winningAllyFactionId: true,
                isActive:             true,
                activeEventId:        true,
                initiationType:       { select: { name: true } },
                participants: {
                    select: {
                        entityId:      true,
                        allyFactionId: true,
                        isDefeated:    true,
                        entity: {
                            select: {
                                name:    true,
                                type:    { select: { name: true } },
                                species: { select: { combatXpReward: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!combat || combat.isActive) return [];

        // Event-triggered combat: XP comes from defeated enemies' species reward
        if (combat.activeEventId !== null) {
            return this._distributeEventCombatXp(combat);
        }

        // Activity-triggered combat: XP comes from guild-configured ActionType_DisciplineReward rows
        const combatType = combat.initiationType.name;
        if (combatType !== 'spar' && combatType !== 'fight') return [];

        const eligible = combat.participants.filter(p => p.entity.type.name === 'Main Character');
        if (eligible.length === 0) return [];

        const rewards = await this.db.actionType_DisciplineReward.findMany({
            where: {
                guildId:        combat.guildId,
                actionType:     { name: combatType },
                recipientScope: { in: ['all', 'winners_only', 'losers_only'] },
            },
            select: {
                disciplineId:   true,
                xpAmount:       true,
                recipientScope: true,
                discipline:     { select: { id: true, baseXp: true, name: true, isStatProgression: true } },
            },
        });
        if (rewards.length === 0) return [];

        const [guildSettings, capRows] = await Promise.all([
            this.db.guildSettings.findFirst({
                where:  { guildId: combat.guildId },
                select: { disciplineLevelCap: true },
            }),
            this.db.guild_DisciplineLevelCap.findMany({
                where:  { guildId: combat.guildId, disciplineDefId: { in: rewards.map(r => r.disciplineId) } },
                select: { disciplineDefId: true, levelCap: true },
            }),
        ]);
        const capMap     = new Map(capRows.map(r => [r.disciplineDefId, r.levelCap]));
        const defaultCap = guildSettings?.disciplineLevelCap ?? null;

        const entityNames    = new Map(eligible.map(p => [p.entityId, p.entity.name]));
        const disciplineMeta = new Map(rewards.map(r => [r.disciplineId, r.discipline]));

        const entityXpMap = new Map<number, Map<number, number>>();
        for (const reward of rewards) {
            let targets: number[];
            if (reward.recipientScope === 'winners_only') {
                if (combat.winningAllyFactionId === null) continue;
                targets = eligible.filter(p => p.allyFactionId === combat.winningAllyFactionId).map(p => p.entityId);
            } else if (reward.recipientScope === 'losers_only') {
                if (combat.winningAllyFactionId === null) continue;
                targets = eligible.filter(p => p.allyFactionId !== combat.winningAllyFactionId).map(p => p.entityId);
            } else {
                targets = eligible.map(p => p.entityId);
            }
            for (const entityId of targets) {
                if (!entityXpMap.has(entityId)) entityXpMap.set(entityId, new Map());
                const disc = entityXpMap.get(entityId)!;
                disc.set(reward.disciplineId, (disc.get(reward.disciplineId) ?? 0) + reward.xpAmount);
            }
        }
        if (entityXpMap.size === 0) return [];

        const entityIds     = [...entityXpMap.keys()];
        const disciplineIds = [...new Set(rewards.map(r => r.disciplineId))];
        const stateRows     = await this.db.entity_Discipline.findMany({
            where:  { entityId: { in: entityIds }, disciplineId: { in: disciplineIds } },
            select: { entityId: true, disciplineId: true, level: true, currentXp: true },
        });
        const stateMap = new Map(stateRows.map(s => [`${s.entityId}:${s.disciplineId}`, s]));

        const results: XpGrant[] = [];
        const updates: Array<{ entityId: number; disciplineId: number; level: number; currentXp: number }> = [];

        for (const [entityId, discGrants] of entityXpMap) {
            for (const [disciplineId, xpGained] of discGrants) {
                const state = stateMap.get(`${entityId}:${disciplineId}`);
                if (!state) continue;
                const cap = capMap.get(disciplineId) ?? defaultCap;
                if (cap !== null && state.level >= cap) continue;
                const meta = disciplineMeta.get(disciplineId)!;
                const computed = this._applyXp(state.level, state.currentXp, xpGained, meta, cap);
                results.push({ entityId, entityName: entityNames.get(entityId) ?? 'Unknown', disciplineId, disciplineName: meta.name, xpGained, levelsGained: computed.levelsGained, newLevel: computed.level });
                updates.push({ entityId, disciplineId, level: computed.level, currentXp: computed.currentXp });
            }
        }

        await this._flushXpUpdates(updates);
        return results;
    }

    private async _distributeEventCombatXp(combat: {
        guildId:              string;
        winningAllyFactionId: number | null;
        participants: Array<{
            entityId:      number;
            allyFactionId: number;
            isDefeated:    boolean;
            entity: {
                name:    string;
                type:    { name: string };
                species: { combatXpReward: number } | null;
            };
        }>;
    }): Promise<XpGrant[]> {
        // Draws award no XP from defeated enemies
        if (combat.winningAllyFactionId === null) return [];

        const totalXp = combat.participants
            .filter(p => p.isDefeated)
            .reduce((sum, p) => sum + (p.entity.species?.combatXpReward ?? 0), 0);
        if (totalXp === 0) return [];

        // Only winning-team Main Characters receive XP
        const winners = combat.participants.filter(
            p => p.allyFactionId === combat.winningAllyFactionId && p.entity.type.name === 'Main Character',
        );
        if (winners.length === 0) return [];

        const combatDisc = await this.db.disciplineDef.findFirst({
            where:  { codeName: 'combat' },
            select: { id: true, name: true, baseXp: true, isStatProgression: true },
        });
        if (!combatDisc) return [];

        const [guildSettings, capRow] = await Promise.all([
            this.db.guildSettings.findFirst({
                where:  { guildId: combat.guildId },
                select: { disciplineLevelCap: true },
            }),
            this.db.guild_DisciplineLevelCap.findFirst({
                where:  { guildId: combat.guildId, disciplineDefId: combatDisc.id },
                select: { levelCap: true },
            }),
        ]);
        const cap = capRow?.levelCap ?? guildSettings?.disciplineLevelCap ?? null;

        const stateRows = await this.db.entity_Discipline.findMany({
            where:  { entityId: { in: winners.map(w => w.entityId) }, disciplineId: combatDisc.id },
            select: { entityId: true, level: true, currentXp: true },
        });
        const stateMap = new Map(stateRows.map(s => [s.entityId, s]));

        const results: XpGrant[] = [];
        const updates: Array<{ entityId: number; disciplineId: number; level: number; currentXp: number }> = [];

        for (const winner of winners) {
            const state = stateMap.get(winner.entityId);
            if (!state) continue;
            if (cap !== null && state.level >= cap) continue;
            const computed = this._applyXp(state.level, state.currentXp, totalXp, combatDisc, cap);
            results.push({
                entityId:       winner.entityId,
                entityName:     winner.entity.name,
                disciplineId:   combatDisc.id,
                disciplineName: combatDisc.name,
                xpGained:       totalXp,
                levelsGained:   computed.levelsGained,
                newLevel:       computed.level,
            });
            updates.push({ entityId: winner.entityId, disciplineId: combatDisc.id, level: computed.level, currentXp: computed.currentXp });
        }

        await this._flushXpUpdates(updates);
        return results;
    }

    private _applyXp(
        level:     number,
        currentXp: number,
        xpGained:  number,
        meta:      { baseXp: number; isStatProgression: boolean },
        cap:       number | null,
    ): { level: number; currentXp: number; levelsGained: number } {
        currentXp += xpGained;
        let levelsGained = 0;
        while (true) {
            const nextLevel = level + 1;
            if (cap !== null && nextLevel > cap) break;
            const threshold = meta.isStatProgression
                ? meta.baseXp
                : Math.floor(meta.baseXp * Math.pow(nextLevel, 1.5));
            if (currentXp < threshold) break;
            currentXp -= threshold;
            level++;
            levelsGained++;
        }
        return { level, currentXp, levelsGained };
    }

    private async _flushXpUpdates(
        updates: Array<{ entityId: number; disciplineId: number; level: number; currentXp: number }>,
    ): Promise<void> {
        if (updates.length === 0) return;
        await this.db.$transaction(
            updates.map(u => this.db.entity_Discipline.update({
                where: { entityId_disciplineId: { entityId: u.entityId, disciplineId: u.disciplineId } },
                data:  { level: u.level, currentXp: u.currentXp },
            }))
        );
    }

    private async _getActionEnergyCost(guildId: string, mode: 'spar' | 'fight'): Promise<number> {
        const config = await this.db.guild_ActionConfig.findFirst({
            where:  { guildId, actionType: { name: mode } },
            select: { energyCost: true },
        });
        return config?.energyCost ?? 0;
    }
}
