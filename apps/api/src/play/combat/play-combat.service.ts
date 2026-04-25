import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';
import { runCombatPipeline } from './engine/combat-pipeline';
import { defaultRoller } from './engine/dice';
import type { CombatActionContext } from './engine/combat-action-context';

// ── Public types ──────────────────────────────────────────────────────────────

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
    | { success: true;  activeCombatId: number; removedEntityIds: number[]; participants: CombatParticipantOrder[]; allowsFleeing: boolean }
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
    profileId:      number;
    storedItemId:   number;
    itemName:       string;
    actionLabel:    string | null;
    targetScope: {
        targetsSelf:    boolean;
        targetsSingle:  boolean;
        targetsAllies:  boolean;
        targetsEnemies: boolean;
    } | null;
    damageDice:     string | null;
    healDice:       string | null;
    cooldownRounds: number;
    isOnCooldown:   boolean;
}

export interface PendingReaction {
    defenderEntityId:   number;
    defenderEntityName: string;
    defenderUserId:     string | null;
    attackerEntityId:   number;
    reactionProfiles:   Array<{ profileId: number; storedItemId: number; label: string }>;
}

export type ActionResultOutcome =
    | { kind: 'hit';      hitRoll: number; targetAC: number; diceRolls: number[]; totalDamage: number; hpAfter: number; knockedDown: boolean; defeated: boolean }
    | { kind: 'miss';     hitRoll: number; targetAC: number }
    | { kind: 'heal';     diceRolls: number[]; totalHeal: number; hpAfter: number }
    | { kind: 'behavior'; effectName: string; guardedName: string | null; rounds: number }
    | { kind: 'no_op' };

export interface ActionResult {
    actionId:         number;
    actionLabel:      string;
    actorName:        string;
    targetName:       string;
    actualTargetName: string;
    wasRedirected:    boolean;
    outcome:          ActionResultOutcome;
    pendingReaction?: PendingReaction;
}

export interface XpGrant {
    entityId:       number;
    entityName:     string;
    disciplineId:   number;
    disciplineName: string;
    xpGained:       number;
    levelsGained:   number;
    newLevel:       number;
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
    allowsFleeing:          boolean;
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

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class PlayCombatService {
    constructor(private readonly db: PrimaryDatabaseService) {}

    // ── Targeting queries ─────────────────────────────────────────────────────

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
        guildId:            string,
        userId:             string,
        initiatorFactionId: number,
        mode:               'spar' | 'fight',
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

    // ── Combat lifecycle ──────────────────────────────────────────────────────

    async startCombat(
        guildId: string,
        type:    'spar' | 'fight',
        teams:   StartCombatTeam[],
    ): Promise<StartCombatResult> {
        const energyCost   = await this._getActionEnergyCost(guildId, type);
        const allEntityIds = teams.flatMap(t => t.entities.map(e => e.entityId));

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
            select: { id: true, allowsFleeing: true },
        });
        if (!initiationType) throw new Error(`Unknown CombatInitiationType: ${type}`);

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
            success:         true,
            activeCombatId:  combat.id,
            removedEntityIds,
            participants:    participants.map(p => ({ entityId: p.entityId, allyFactionId: p.allyFactionId })),
            allowsFleeing:   initiationType.allowsFleeing,
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

        const cooldowns = participantId
            ? await this.db.activeCombat_Participant_ActionCooldown.findMany({
                where:  { participantId },
                select: { equipmentProfileId: true },
            })
            : [];
        const cooldownProfileIds = new Set(cooldowns.map(c => c.equipmentProfileId));

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
                currentTurnOrder: true,
                currentRound:     true,
                initiationType:   { select: { canSecondWind: true, allowsFleeing: true } },
                participants: {
                    where:   { hasFled: false, isDefeated: false },
                    select: {
                        id:               true,
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
        const allowsFleeing = combat.initiationType.allowsFleeing;

        const currentIdx    = active.findIndex(p => p.entityId === currentEntityId);
        const nextIdx       = active.length > 0 ? (currentIdx + 1) % active.length : 0;
        const roundBoundary = active.length > 0 && nextIdx <= currentIdx;

        let newRound = combat.currentRound;
        if (roundBoundary) newRound++;

        const endingParticipant = active.find(p => p.entityId === currentEntityId);
        const turnEndEvents = endingParticipant
            ? await this._processTurnEnd(combatId, endingParticipant.id, canSecondWind)
            : [];

        type ParticipantRow = typeof active[0];
        const freshActive: ParticipantRow[] = await this.db.activeCombat_Participant.findMany({
            where:   { activeCombatId: combatId, hasFled: false, isDefeated: false },
            select: {
                id:               true,
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

        const factions = new Set(freshActive.map(p => p.allyFactionId));
        if (factions.size < 2) {
            const winningAllyFactionId = factions.size === 1 ? [...factions][0]! : null;
            const outcomeName          = winningAllyFactionId !== null ? 'win' : 'draw';
            const outcome              = await this.db.combatOutcome.findFirst({ where: { name: outcomeName }, select: { id: true } });
            await this.db.activeCombat.update({
                where: { id: combatId },
                data:  {
                    isActive:             false,
                    winningAllyFactionId: winningAllyFactionId ?? null,
                    ...(outcome ? { outcomeId: outcome.id } : {}),
                    completedAt:          new Date(),
                },
            });
            return { combatEnded: true, turnEndEvents, nextEntityId: null, nextEntityName: null, nextUserId: null, isAiControlled: false, isAwaitingSecondWind: false, allowsFleeing, round: newRound, winningAllyFactionId };
        }

        const currentTurnOrder = active.find(p => p.entityId === currentEntityId)?.turnOrder ?? 0;
        const next             = freshActive.find(p => p.turnOrder > currentTurnOrder) ?? freshActive[0]!;

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
            allowsFleeing,
            round:                newRound,
            winningAllyFactionId: null,
        };
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

    async flee(combatId: number, entityId: number): Promise<{ allowed: boolean }> {
        const combat = await this.db.activeCombat.findUnique({
            where:  { id: combatId },
            select: { initiationType: { select: { allowsFleeing: true } } },
        });
        if (!combat?.initiationType.allowsFleeing) return { allowed: false };
        await this.db.activeCombat_Participant.update({
            where: { activeCombatId_entityId: { activeCombatId: combatId, entityId } },
            data:  { hasFled: true },
        });
        return { allowed: true };
    }

    // ── Action resolution ─────────────────────────────────────────────────────

    async processAction(
        combatId:       number,
        actorEntityId:  number,
        profileId:      number,
        storedItemId:   number,
        targetEntityId: number | null,
        roundNumber:    number,
    ): Promise<ActionResult> {
        const ctx = await runCombatPipeline(
            { combatId, actorEntityId, profileId, storedItemId, targetEntityId, roundNumber },
            { db: this.db, roller: defaultRoller },
        );

        if (ctx.aborted) throw new Error(ctx.abortReason ?? 'Action aborted');

        return this._toActionResult(ctx);
    }

    // Stage 1: reactions are not triggered by the pipeline yet.
    // This endpoint exists to satisfy the HTTP surface; it is a no-op until stage 2.
    async processReaction(
        _combatId:         number,
        _defenderEntityId: number,
        _profileId:        number,
        _storedItemId:     number,
        _attackerEntityId: number,
        _roundNumber:      number,
    ): Promise<ActionResult> {
        return {
            actionId:         0,
            actionLabel:      'Reaction',
            actorName:        'Unknown',
            targetName:       'Unknown',
            actualTargetName: 'Unknown',
            wasRedirected:    false,
            outcome:          { kind: 'no_op' },
        };
    }

    // ── XP distribution ───────────────────────────────────────────────────────

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

        if (combat.activeEventId !== null) {
            return this._distributeEventCombatXp(combat);
        }

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
                const cap  = capMap.get(disciplineId) ?? defaultCap;
                if (cap !== null && state.level >= cap) continue;
                const meta     = disciplineMeta.get(disciplineId)!;
                const computed = this._applyXp(state.level, state.currentXp, xpGained, meta, cap);
                results.push({ entityId, entityName: entityNames.get(entityId) ?? 'Unknown', disciplineId, disciplineName: meta.name, xpGained, levelsGained: computed.levelsGained, newLevel: computed.level });
                updates.push({ entityId, disciplineId, level: computed.level, currentXp: computed.currentXp });
            }
        }

        await this._flushXpUpdates(updates);
        return results;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private _toActionResult(ctx: CombatActionContext): ActionResult {
        let outcome: ActionResultOutcome;

        if (ctx.profile?.dealsDamage) {
            if (ctx.isHit === true) {
                outcome = {
                    kind:        'hit',
                    hitRoll:     ctx.hitTotal!,
                    targetAC:    ctx.targetAC,
                    diceRolls:   ctx.diceRolls,
                    totalDamage: ctx.finalDamage,
                    hpAfter:     ctx.hpAfter ?? 0,
                    knockedDown: ctx.knockedDown,
                    defeated:    ctx.defeated,
                };
            } else {
                outcome = { kind: 'miss', hitRoll: ctx.hitTotal!, targetAC: ctx.targetAC };
            }
        } else {
            outcome = { kind: 'no_op' };
        }

        const targetName = ctx.wasRedirected
            ? (ctx.originalTargetName ?? ctx.target?.name ?? 'Unknown')
            : (ctx.target?.name ?? 'Unknown');

        return {
            actionId:         ctx.actionId ?? 0,
            actionLabel:      ctx.profile?.label ?? 'Unknown',
            actorName:        ctx.actor?.name ?? 'Unknown',
            targetName,
            actualTargetName: ctx.target?.name ?? 'Unknown',
            wasRedirected:    ctx.wasRedirected,
            outcome,
            pendingReaction:  ctx.pendingReaction ?? undefined,
        };
    }

    // Stage 1: only ticks down cooldowns. DoT/HoT and stat-effect decrement are stage 2+.
    private async _processTurnEnd(combatId: number, participantId: number, _canSecondWind: boolean): Promise<RoundEndEvent[]> {
        await this.db.$transaction([
            this.db.activeCombat_Participant_ActionCooldown.deleteMany({
                where: { participantId, roundsRemaining: 1 },
            }),
            this.db.activeCombat_Participant_ActionCooldown.updateMany({
                where: { participantId, roundsRemaining: { gt: 1 } },
                data:  { roundsRemaining: { decrement: 1 } },
            }),
        ]);
        return [];
    }

    // Stage 1: no-op. Behavior effect decrement is stage 2+.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async _processTurnStart(_combatId: number, _participantId: number): Promise<void> {}

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
        if (combat.winningAllyFactionId === null) return [];

        const totalXp = combat.participants
            .filter(p => p.isDefeated)
            .reduce((sum, p) => sum + (p.entity.species?.combatXpReward ?? 0), 0);
        if (totalXp === 0) return [];

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
            results.push({ entityId: winner.entityId, entityName: winner.entity.name, disciplineId: combatDisc.id, disciplineName: combatDisc.name, xpGained: totalXp, levelsGained: computed.levelsGained, newLevel: computed.level });
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
