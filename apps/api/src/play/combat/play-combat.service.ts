import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';
import { runCombatPipeline } from './engine/combat-pipeline';
import { COMBAT_INTERCEPTORS } from './engine/interceptors';
import { defaultRoller, rollDice } from '../../utils/dice';
import type { CombatActionContext, PendingReaction, ConcentrationSaveEvent } from './engine/combat-action-context';

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
    profileId:      number | null;  // null for builtin universal actions
    storedItemId:   number | null;  // null for builtin universal actions
    builtinAction:  'dodge' | 'help' | null;
    itemName:       string;
    actionLabel:    string | null;
    targetScope: {
        targetsSelf:    boolean;
        targetsSingle:  boolean;
        targetsAllies:  boolean;
        targetsEnemies: boolean;
    } | null;
    damageDice:              string | null;
    damageTypeName:          string | null;
    elementalDamageDice:     string | null;
    elementalDamageTypeName: string | null;
    healDice:       string | null;
    cooldownRounds: number;
    isOnCooldown:   boolean;
}

export type { PendingReaction, ConcentrationSaveEvent } from './engine/combat-action-context';

export type ActionResultOutcome =
    | { kind: 'hit'; hitRoll: number; targetAC: number; isCritical: boolean; diceRolls: number[]; totalDamage: number; damageTypeName: string | null; elementalDiceRolls: number[]; totalElementalDamage: number; elementalDamageTypeName: string | null; absorbedDamage: number; tempHpDrained: number; saveRoll: number | null; saveTotal: number | null; savedSuccessfully: boolean | null; hpAfter: number; knockedDown: boolean; defeated: boolean }
    | { kind: 'miss';     hitRoll: number; targetAC: number; isFumble: boolean }
    | { kind: 'heal';     diceRolls: number[]; totalHeal: number; hpAfter: number }
    | { kind: 'behavior'; effectName: string; guardedName: string | null; rounds: number }
    | { kind: 'no_op' };

export interface SummonedEntity {
    entityId:      number;
    name:          string;
    allyFactionId: number;
    turnOrder:     number;
}

export interface ActionResult {
    actionId:               number;
    actionLabel:            string;
    actorName:              string;
    targetName:             string;
    actualTargetName:       string;
    wasRedirected:          boolean;
    legendaryResistanceUsed: boolean;
    outcome:                ActionResultOutcome;
    appliedEffects:         string[];
    pendingReaction?:       PendingReaction;
    concentrationSaveEvent: ConcentrationSaveEvent | null;
    summonedEntities:       SummonedEntity[];
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
    kind:        'dot' | 'hot';
    entityId:    number;
    entityName:  string;
    amount:      number;
    hpAfter:     number;
    defeated:    boolean;
    knockedDown: boolean;  // true when HP hits 0 and entity enters death save state
}

export interface DeathSaveEvent {
    entityId:   number;
    entityName: string;
    roll:       number;  // raw d20 result
    successes:  number;  // total after this roll
    failures:   number;  // total after this roll
    result:     'success' | 'failure' | 'revived' | 'stable' | 'defeated';
}

export interface MortallyWoundedCharacter {
    entityId:    number;
    name:        string;
    userId:      string | null;
    wasDefeated: boolean;  // true = died from 3 save failures; false = still unconscious at combat end
}

export interface AdvanceTurnResult {
    combatEnded:          boolean;
    turnEndEvents:        RoundEndEvent[];
    nextEntityId:         number | null;
    nextEntityName:       string | null;
    nextUserId:           string | null;
    isAiControlled:       boolean;
    deathSaveEvent:       DeathSaveEvent | null;
    allowsFleeing:        boolean;
    round:                number;
    winningAllyFactionId: number | null;
    mortallyWounded:      MortallyWoundedCharacter[];  // non-empty only when combatEnded = true and canResultInDeath = true
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
                const roll     = rollDice(1, 20, defaultRoller)[0]! + modifier;
                return { entityId: e.entityId, allyFactionId: teamIdx + 1, initiativeRoll: roll };
            }),
        );
        const tiebreakers = new Map(participants.map(p => [p.entityId, rollDice(1, 20, defaultRoller)[0]!]));
        participants.sort((a, b) =>
            b.initiativeRoll - a.initiativeRoll ||
            (dexByEntity.get(b.entityId) ?? 10) - (dexByEntity.get(a.entityId) ?? 10) ||
            tiebreakers.get(b.entityId)! - tiebreakers.get(a.entityId)!,
        );

        const eligibleEntityIds = participants.map(p => p.entityId);

        const legendaryRows = await this.db.entity.findMany({
            where:  { id: { in: eligibleEntityIds } },
            select: { id: true, species: { select: { legendaryResistancesMax: true } } },
        });
        const legendaryMaxMap = new Map(legendaryRows.map(r => [r.id, r.species?.legendaryResistancesMax ?? null]));

        const combat = await this.db.$transaction(async (tx) => {
            const created = await tx.activeCombat.create({
                data: {
                    guildId,
                    initiationTypeId: initiationType.id,
                    participants: {
                        create: participants.map((p, i) => ({
                            entityId:                    p.entityId,
                            allyFactionId:               p.allyFactionId,
                            turnOrder:                   i + 1,
                            legendaryResistancesRemaining: legendaryMaxMap.get(p.entityId) ?? null,
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

        await this._seedPreCombatEffects(combat.id, eligibleEntityIds);

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

        // profileSelect defined early so it can be reused in the override replacement fetch below.
        const profileSelect = {
            id:              true,
            label:           true,
            cooldownRounds:  true,
            targetScope:     { select: { targetsSelf: true, targetsSingle: true, targetsAllies: true, targetsEnemies: true } },
            damageDiceCount:     true,
            damageDiceSides:     true,
            damageType:          { select: { name: true } },
            elementalDiceCount:  true,
            elementalDiceSides:  true,
            elementalDamageType: { select: { name: true } },
            healDiceCount:   true,
            healDiceSides:   true,
        } as const;

        const [combat, cooldowns, entityStorage, rawOverrides] = await Promise.all([
            this.db.activeCombat.findUnique({
                where:  { id: combatId },
                select: { initiationType: { select: { name: true } } },
            }),
            this.db.activeCombat_Participant_ActionCooldown.findMany({
                where:  { participant: { activeCombatId: combatId, entityId } },
                select: { equipmentProfileId: true },
            }),
            this.db.entity_Storage.findUnique({
                where:  { entityId },
                select: { storageId: true },
            }),
            this.db.entity_ProfileOverride.findMany({
                where:  { entityId },
                select: { originalProfileId: true, replacementProfileId: true },
            }),
        ]);
        if (!combat) return [];
        if (!entityStorage) return [];

        const isSpar             = combat.initiationType.name === 'spar';
        const cooldownProfileIds = new Set(cooldowns.map(c => c.equipmentProfileId));

        // Build override lookup: originalProfileId → replacementProfileId.
        // Used in both the equipped path and the item-category path below.
        const overriddenIds     = new Set(rawOverrides.map(o => o.originalProfileId));
        const replacementIdList = rawOverrides.map(o => o.replacementProfileId);

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
                    // Hide profiles that have been superseded by an active override.
                    if (overriddenIds.has(profile.id)) continue;
                    actions.push({
                        profileId:               profile.id,
                        storedItemId:            stored.id,
                        builtinAction:           null,
                        itemName:                stored.item.name,
                        actionLabel:             profile.label,
                        targetScope:             profile.targetScope,
                        damageDice:              profile.damageDiceCount   ? `${profile.damageDiceCount}d${profile.damageDiceSides}`     : null,
                        damageTypeName:          profile.damageType?.name  ?? null,
                        elementalDamageDice:     profile.elementalDiceCount ? `${profile.elementalDiceCount}d${profile.elementalDiceSides}` : null,
                        elementalDamageTypeName: profile.elementalDamageType?.name ?? null,
                        healDice:                profile.healDiceCount     ? `${profile.healDiceCount}d${profile.healDiceSides}`           : null,
                        cooldownRounds:          profile.cooldownRounds,
                        isOnCooldown:            cooldownProfileIds.has(profile.id),
                    });
                }
            }
            return actions;
        }

        // Fetch equipped items whose chosenProfile matches the category, OR whose chosenProfileId
        // is overridden (replacement may satisfy the category even if original does not).
        const overriddenIdsArray = [...overriddenIds];
        const equipped = await this.db.storedItem.findMany({
            where: {
                storageId:  entityStorage.storageId,
                isEquipped: true,
                OR: [
                    { chosenProfile: profileWhere },
                    ...(overriddenIdsArray.length > 0 ? [{ chosenProfileId: { in: overriddenIdsArray } }] : []),
                ],
            },
            select: {
                id:              true,
                chosenProfileId: true,
                item:            { select: { name: true } },
                chosenProfile:   { select: profileSelect },
            },
        });

        // Fetch replacement profiles filtered to the current category so cross-category overrides
        // are silently excluded (replacement not shown if it doesn't match the active category).
        const replacementProfiles = replacementIdList.length > 0
            ? await this.db.itemEquipmentProfile.findMany({
                where:  { id: { in: replacementIdList }, ...profileWhere },
                select: profileSelect,
            })
            : [];
        const replacementById = new Map(replacementProfiles.map(p => [p.id, p]));

        // Override map: originalProfileId → replacement profile (only those matching current category).
        const overrideProfileMap = new Map(
            rawOverrides
                .filter(o => replacementById.has(o.replacementProfileId))
                .map(o => [o.originalProfileId, replacementById.get(o.replacementProfileId)!]),
        );

        const builtins: AvailableAction[] = [
            {
                profileId: null, storedItemId: null, builtinAction: 'dodge',
                itemName: 'Dodge', actionLabel: 'Dodge',
                targetScope: { targetsSelf: true, targetsSingle: false, targetsAllies: false, targetsEnemies: false },
                damageDice: null, damageTypeName: null, elementalDamageDice: null, elementalDamageTypeName: null,
                healDice: null, cooldownRounds: 0, isOnCooldown: false,
            },
            {
                profileId: null, storedItemId: null, builtinAction: 'help',
                itemName: 'Help', actionLabel: 'Help',
                targetScope: { targetsSelf: false, targetsSingle: true, targetsAllies: true, targetsEnemies: true },
                damageDice: null, damageTypeName: null, elementalDamageDice: null, elementalDamageTypeName: null,
                healDice: null, cooldownRounds: 0, isOnCooldown: false,
            },
        ];

        const itemActions = equipped
            .filter(s => s.chosenProfileId !== null)
            .flatMap(s => {
                // Use the replacement profile if an override is active; fall back to the equipped profile.
                const effectiveProfile = overrideProfileMap.get(s.chosenProfileId!) ?? s.chosenProfile;
                // If neither matches the current category (e.g. item fetched via the OR but replacement
                // is a different category), skip it.
                if (effectiveProfile === null) return [];
                return [{
                    profileId:               effectiveProfile.id,
                    storedItemId:            s.id,
                    builtinAction:           null as null,
                    itemName:                s.item.name,
                    actionLabel:             effectiveProfile.label,
                    targetScope:             effectiveProfile.targetScope,
                    damageDice:              effectiveProfile.damageDiceCount
                        ? `${effectiveProfile.damageDiceCount}d${effectiveProfile.damageDiceSides}`
                        : null,
                    damageTypeName:          effectiveProfile.damageType?.name  ?? null,
                    elementalDamageDice:     effectiveProfile.elementalDiceCount
                        ? `${effectiveProfile.elementalDiceCount}d${effectiveProfile.elementalDiceSides}`
                        : null,
                    elementalDamageTypeName: effectiveProfile.elementalDamageType?.name ?? null,
                    healDice:                effectiveProfile.healDiceCount
                        ? `${effectiveProfile.healDiceCount}d${effectiveProfile.healDiceSides}`
                        : null,
                    cooldownRounds:          effectiveProfile.cooldownRounds,
                    isOnCooldown:            cooldownProfileIds.has(effectiveProfile.id),
                }];
            });

        return [...builtins, ...itemActions];
    }

    async advanceTurn(combatId: number, currentEntityId: number): Promise<AdvanceTurnResult> {
        const [combat, endingParticipant] = await Promise.all([
            this.db.activeCombat.findUnique({
                where:  { id: combatId },
                select: {
                    currentTurnOrder: true,
                    currentRound:     true,
                    initiationType:   { select: { usesDeathSaves: true, allowsFleeing: true, canResultInDeath: true } },
                },
            }),
            this.db.activeCombat_Participant.findFirst({
                where:  { activeCombatId: combatId, entityId: currentEntityId },
                select: { id: true },
            }),
        ]);
        if (!combat) throw new Error(`Combat ${combatId} not found`);

        const usesDeathSaves  = combat.initiationType.usesDeathSaves;
        const allowsFleeing   = combat.initiationType.allowsFleeing;
        const canResultInDeath = combat.initiationType.canResultInDeath;

        const turnEndEvents = endingParticipant
            ? await this._processTurnEnd(endingParticipant.id, usesDeathSaves)
            : [];

        let freshActive = await this.db.activeCombat_Participant.findMany({
            where:   { activeCombatId: combatId, hasFled: false, isDefeated: false },
            select: {
                id:                   true,
                entityId:             true,
                allyFactionId:        true,
                turnOrder:            true,
                isAiControlled:       true,
                isUnconscious:         true,
                deathSaveSuccesses:   true,
                deathSaveFailures:    true,
                controllerUserId:     true,
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

        // roundBoundary: no remaining participant has a higher turnOrder than the current one,
        // meaning the next turn wraps back to the start of initiative — a new round.
        const roundBoundary = freshActive.length > 0 && !freshActive.some(p => p.turnOrder > combat.currentTurnOrder);
        const newRound      = roundBoundary ? combat.currentRound + 1 : combat.currentRound;

        const endCombat = async (active: typeof freshActive): Promise<AdvanceTurnResult> => {
            const factions             = new Set(active.map(p => p.allyFactionId));
            const winningAllyFactionId = factions.size === 1 ? [...factions][0]! : null;
            const outcomeName          = winningAllyFactionId !== null ? 'win' : 'draw';

            const [outcome, mortallyWoundedRows] = await Promise.all([
                this.db.combatOutcome.findFirst({ where: { name: outcomeName }, select: { id: true } }),
                canResultInDeath
                    ? this.db.activeCombat_Participant.findMany({
                        where: {
                            activeCombatId: combatId,
                            isAiControlled: false,
                            hasFled:        false,
                            isDefeated:     true,
                        },
                        select: {
                            entityId: true,
                            entity:   { select: { name: true, userId: true } },
                        },
                    })
                    : Promise.resolve([]),
            ]);

            await this.db.activeCombat.update({
                where: { id: combatId },
                data:  {
                    isActive:             false,
                    winningAllyFactionId: winningAllyFactionId ?? null,
                    ...(outcome ? { outcomeId: outcome.id } : {}),
                    completedAt:          new Date(),
                },
            });

            const mortallyWounded: MortallyWoundedCharacter[] = mortallyWoundedRows.map(r => ({
                entityId:    r.entityId,
                name:        r.entity.name,
                userId:      r.entity.userId ?? null,
                wasDefeated: true,
            }));

            return { combatEnded: true, turnEndEvents, nextEntityId: null, nextEntityName: null, nextUserId: null, isAiControlled: false, deathSaveEvent: null, allowsFleeing, round: newRound, winningAllyFactionId, mortallyWounded };
        };

        if (new Set(freshActive.map(p => p.allyFactionId)).size < 2) {
            return endCombat(freshActive);
        }

        let next = freshActive.find(p => p.turnOrder > combat.currentTurnOrder) ?? freshActive[0]!;

        // ── Death saving throw ────────────────────────────────────────────────
        // If the next entity is knocked down (isUnconscious) and player-controlled,
        // their "turn" is consumed by a death save roll. The actual acting turn then
        // passes to the entity after them (unless they roll a natural 20 and revive).
        let deathSaveEvent: DeathSaveEvent | null = null;

        if (next.isUnconscious && !next.isAiControlled) {
            const roll        = rollDice(1, 20, defaultRoller)[0]!;
            let newSuccesses  = next.deathSaveSuccesses;
            let newFailures   = next.deathSaveFailures;
            let result: DeathSaveEvent['result'];

            if (roll === 20) {
                // Natural 20: revive at 1 HP — entity gets to act this turn.
                result       = 'revived';
                newSuccesses = 0;
                newFailures  = 0;
                await this.db.$transaction([
                    this.db.entityStats.update({
                        where: { entityId: next.entityId },
                        data:  { currentHp: 1 },
                    }),
                    this.db.activeCombat_Participant.update({
                        where: { id: next.id },
                        data:  { isUnconscious: false, deathSaveSuccesses: 0, deathSaveFailures: 0 },
                    }),
                ]);
            } else if (roll === 1) {
                // Natural 1: two failures.
                newFailures = Math.min(next.deathSaveFailures + 2, 3);
                if (newFailures >= 3) {
                    result = 'defeated';
                    await this.db.$transaction([
                        this.db.activeCombat_Participant.update({
                            where: { id: next.id },
                            data:  { isDefeated: true, deathSaveFailures: newFailures },
                        }),
                        this.db.activeCombat_BehaviorEffect.deleteMany({ where: { sourceParticipantId: next.id } }),
                        this.db.activeCombat_StatEffect.deleteMany({ where: { affectedParticipantId: next.id } }),
                    ]);
                    freshActive = freshActive.filter(p => p.id !== next.id);
                } else {
                    result = 'failure';
                    await this.db.activeCombat_Participant.update({
                        where: { id: next.id },
                        data:  { deathSaveFailures: newFailures },
                    });
                }
            } else if (roll >= 10) {
                newSuccesses = next.deathSaveSuccesses + 1;
                if (newSuccesses >= 3) {
                    // Stable: no longer rolling saves; remains at 0 HP until healed.
                    result = 'stable';
                    await this.db.activeCombat_Participant.update({
                        where: { id: next.id },
                        data:  { isUnconscious: false, deathSaveSuccesses: newSuccesses },
                    });
                } else {
                    result = 'success';
                    await this.db.activeCombat_Participant.update({
                        where: { id: next.id },
                        data:  { deathSaveSuccesses: newSuccesses },
                    });
                }
            } else {
                newFailures = next.deathSaveFailures + 1;
                if (newFailures >= 3) {
                    result = 'defeated';
                    await this.db.$transaction([
                        this.db.activeCombat_Participant.update({
                            where: { id: next.id },
                            data:  { isDefeated: true, deathSaveFailures: newFailures },
                        }),
                        this.db.activeCombat_BehaviorEffect.deleteMany({ where: { sourceParticipantId: next.id } }),
                        this.db.activeCombat_StatEffect.deleteMany({ where: { affectedParticipantId: next.id } }),
                    ]);
                    freshActive = freshActive.filter(p => p.id !== next.id);
                } else {
                    result = 'failure';
                    await this.db.activeCombat_Participant.update({
                        where: { id: next.id },
                        data:  { deathSaveFailures: newFailures },
                    });
                }
            }

            deathSaveEvent = {
                entityId:   next.entityId,
                entityName: next.entity.name,
                roll,
                successes:  newSuccesses,
                failures:   newFailures,
                result,
            };

            if (result !== 'revived') {
                // Turn passes to the entity after the death-saver.
                if (result === 'defeated') {
                    if (new Set(freshActive.map(p => p.allyFactionId)).size < 2) {
                        return endCombat(freshActive);
                    }
                }
                const deathSaverTurnOrder = next.turnOrder;
                next = freshActive.find(p => p.turnOrder > deathSaverTurnOrder) ?? freshActive[0]!;
            }
        }

        await this.db.$transaction([
            // Clear unconsumed Help roll mod on the participant whose turn just ended.
            ...(endingParticipant ? [this.db.activeCombat_Participant.updateMany({
                where: { id: endingParticipant.id, helpRollMod: { not: null } },
                data:  { helpRollMod: null },
            })] : []),
            this.db.activeCombat_BehaviorEffect.deleteMany({
                where: { sourceParticipantId: next.id, roundsRemaining: 1 },
            }),
            this.db.activeCombat_BehaviorEffect.updateMany({
                where: { sourceParticipantId: next.id, roundsRemaining: { gt: 1 } },
                data:  { roundsRemaining: { decrement: 1 } },
            }),
            this.db.activeCombat.update({
                where: { id: combatId },
                data:  { currentTurnOrder: next.turnOrder, currentRound: newRound },
            }),
            this.db.activeCombat_Participant.update({
                where: { id: next.id },
                data:  { hasUsedReaction: false },
            }),
        ]);

        return {
            combatEnded:          false,
            turnEndEvents,
            nextEntityId:         next.entityId,
            nextEntityName:       next.entity.name,
            nextUserId:           next.controllerUserId ?? next.entity.userId ?? null,
            isAiControlled:       next.isAiControlled,
            deathSaveEvent,
            allowsFleeing,
            round:                newRound,
            winningAllyFactionId: null,
            mortallyWounded:      [],
        };
    }

    async markDeceased(entityId: number): Promise<void> {
        await this.db.entity.update({
            where: { id: entityId },
            data:  { isDeceased: true },
        });
    }

    async flee(combatId: number, entityId: number): Promise<{ allowed: boolean }> {
        const combat = await this.db.activeCombat.findUnique({
            where:  { id: combatId },
            select: { initiationType: { select: { allowsFleeing: true } } },
        });
        if (!combat?.initiationType.allowsFleeing) return { allowed: false };
        const participant = await this.db.activeCombat_Participant.findUnique({
            where:  { activeCombatId_entityId: { activeCombatId: combatId, entityId } },
            select: { id: true },
        });
        if (!participant) return { allowed: false };
        await this.db.$transaction([
            this.db.activeCombat_Participant.update({
                where: { id: participant.id },
                data:  { hasFled: true },
            }),
            this.db.activeCombat_BehaviorEffect.deleteMany({
                where: { sourceParticipantId: participant.id },
            }),
            this.db.activeCombat_StatEffect.deleteMany({
                where: { affectedParticipantId: participant.id },
            }),
        ]);
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
    ): Promise<ActionResult | ActionResult[]> {
        // Detect AoE and multiattack before running the pipeline, and fetch actor faction + guildId in parallel.
        const [scopeRow, actorPart] = await Promise.all([
            this.db.itemEquipmentProfile.findUnique({
                where:  { id: profileId },
                select: { attackCount: true, targetScope: { select: { targetsSingle: true, targetsAllies: true, targetsEnemies: true } } },
            }),
            this.db.activeCombat_Participant.findFirst({
                where:  { activeCombatId: combatId, entityId: actorEntityId },
                select: { allyFactionId: true, activeCombat: { select: { guildId: true } } },
            }),
        ]);
        const scope = scopeRow?.targetScope ?? null;
        const isAoe = scope !== null
            && (scope.targetsAllies || scope.targetsEnemies)
            && !scope.targetsSingle;

        if (isAoe) {
            if (!actorPart) throw new Error('Actor not found in combat');

            // Build faction filter: allies share allyFactionId, enemies differ.
            const factionFilter = (scope.targetsAllies && scope.targetsEnemies)
                ? {}
                : scope.targetsAllies
                ? { allyFactionId:       actorPart.allyFactionId }
                : { allyFactionId: { not: actorPart.allyFactionId } };

            const targets = await this.db.activeCombat_Participant.findMany({
                where:   { activeCombatId: combatId, isDefeated: false, hasFled: false, ...factionFilter },
                orderBy: { turnOrder: 'asc' },
                select:  { entityId: true },
            });

            const results: ActionResult[] = [];
            let firstCtx: CombatActionContext | null = null;
            for (let i = 0; i < targets.length; i++) {
                const ctx = await runCombatPipeline(
                    { combatId, actorEntityId, profileId, storedItemId, targetEntityId: targets[i]!.entityId, roundNumber, isReaction: false, aoeIndex: i },
                    { db: this.db, roller: defaultRoller },
                    COMBAT_INTERCEPTORS,
                );
                // Actor-side abort on the first target (off-turn, stunned, etc.) fails the whole AoE.
                if (i === 0 && ctx.aborted) throw new Error(ctx.abortReason ?? 'Action aborted');
                if (ctx.aborted) continue;
                if (!firstCtx) firstCtx = ctx;
                results.push(this._toActionResult(ctx));
            }

            // Summons fire once per action — requires a hit for damaging actions, same gate as behavior effects.
            if (firstCtx && firstCtx.profile?.summonSpeciesId && (!firstCtx.profile.dealsDamage || firstCtx.isHit)) {
                const summons = await this._executeSummons(firstCtx.profile.summonSpeciesId, firstCtx.profile.summonDiceCount, firstCtx.profile.summonDiceSides, actorPart.activeCombat.guildId, combatId, actorPart.allyFactionId, roundNumber);
                if (results.length > 0) results[0]!.summonedEntities.push(...summons);
            }

            return results;
        }

        // Single-target path (also handles multiattack when attackCount > 1).
        const attackCount = scopeRow?.attackCount ?? 1;
        const ctx = await runCombatPipeline(
            { combatId, actorEntityId, profileId, storedItemId, targetEntityId, roundNumber, isReaction: false, aoeIndex: null },
            { db: this.db, roller: defaultRoller },
            COMBAT_INTERCEPTORS,
        );
        if (ctx.aborted) throw new Error(ctx.abortReason ?? 'Action aborted');
        const result = this._toActionResult(ctx);

        // Summons fire after the first attack — requires a hit for damaging actions.
        if (ctx.profile?.summonSpeciesId && (!ctx.profile.dealsDamage || ctx.isHit) && actorPart) {
            result.summonedEntities.push(...await this._executeSummons(ctx.profile.summonSpeciesId, ctx.profile.summonDiceCount, ctx.profile.summonDiceSides, actorPart.activeCombat.guildId, combatId, actorPart.allyFactionId, roundNumber));
        }

        if (attackCount <= 1) return result;

        // Multiattack: run additional attacks with aoeIndex: 1 (skips cooldown/use decrement, suppresses reactions).
        const results: ActionResult[] = [result];
        for (let i = 1; i < attackCount; i++) {
            const extraCtx = await runCombatPipeline(
                { combatId, actorEntityId, profileId, storedItemId, targetEntityId, roundNumber, isReaction: false, aoeIndex: 1 },
                { db: this.db, roller: defaultRoller },
                COMBAT_INTERCEPTORS,
            );
            if (!extraCtx.aborted) results.push(this._toActionResult(extraCtx));
        }
        return results;
    }

    async processReaction(
        combatId:         number,
        defenderEntityId: number,
        profileId:        number,
        storedItemId:     number,
        attackerEntityId: number,
        roundNumber:      number,
    ): Promise<ActionResult> {
        const ctx = await runCombatPipeline(
            { combatId, actorEntityId: defenderEntityId, profileId, storedItemId, targetEntityId: attackerEntityId, roundNumber, isReaction: true, aoeIndex: null },
            { db: this.db, roller: defaultRoller },
            COMBAT_INTERCEPTORS,
        );
        if (ctx.aborted) throw new Error(ctx.abortReason ?? 'Reaction aborted');
        return this._toActionResult(ctx);
    }

    // ── Universal builtin actions (Dodge, Help) ───────────────────────────────

    async processBuiltinAction(
        combatId:       number,
        actorEntityId:  number,
        action:         'dodge' | 'help',
        targetEntityId: number | null,
        roundNumber:    number,
    ): Promise<ActionResult> {
        const [actorPart, combat, existingCount, actorEntity] = await Promise.all([
            this.db.activeCombat_Participant.findFirst({
                where:  { activeCombatId: combatId, entityId: actorEntityId },
                select: { id: true, turnOrder: true, isDefeated: true, hasFled: true, isUnconscious: true, allyFactionId: true },
            }),
            this.db.activeCombat.findUnique({
                where:  { id: combatId },
                select: { currentTurnOrder: true, initiationType: { select: { name: true } } },
            }),
            this.db.activeCombat_Action.count({
                where: { activeCombatId: combatId, roundNumber },
            }),
            this.db.entity.findUnique({
                where:  { id: actorEntityId },
                select: { name: true },
            }),
        ]);

        if (!actorPart || !combat || !actorEntity) throw new Error('Combat data could not be loaded.');
        if (actorPart.isDefeated || actorPart.hasFled || actorPart.isUnconscious) throw new Error('You cannot act.');
        if (actorPart.turnOrder !== combat.currentTurnOrder) throw new Error('It is not this entity\'s turn.');

        const stun = await this.db.activeCombat_BehaviorEffect.findFirst({
            where:  { affectedParticipantId: actorPart.id, effectType: { deniesActions: true } },
            select: { id: true },
        });
        if (stun) throw new Error('You are stunned and cannot act.');

        const mainCategory = await this.db.combatActionCategory.findFirst({
            where:  { name: 'Main Action' },
            select: { id: true },
        });

        if (action === 'dodge') {
            const dodgeType = await this.db.combatEffectType.findFirst({
                where:  { grantsHitDisadvantage: true },
                select: { id: true },
            });
            if (!dodgeType) throw new Error('Dodge effect type not found.');

            const logged = await this.db.$transaction(async tx => {
                const log = await tx.activeCombat_Action.create({
                    data: {
                        activeCombatId:  combatId,
                        roundNumber,
                        turnIndex:       existingCount + 1,
                        actorEntityId,
                        actionCategoryId: mainCategory?.id ?? null,
                    },
                    select: { id: true },
                });

                await tx.activeCombat_BehaviorEffect.upsert({
                    where:  { affectedParticipantId_effectTypeId: { affectedParticipantId: actorPart.id, effectTypeId: dodgeType.id } },
                    create: {
                        activeCombatId:        combatId,
                        effectTypeId:          dodgeType.id,
                        affectedParticipantId: actorPart.id,
                        sourceParticipantId:   actorPart.id,
                        roundsRemaining:       1,
                    },
                    update: {
                        sourceParticipantId: actorPart.id,
                        roundsRemaining:     1,
                    },
                });

                return log;
            });

            return {
                actionId:                logged.id,
                actionLabel:             'Dodge',
                actorName:               actorEntity.name,
                targetName:              actorEntity.name,
                actualTargetName:        actorEntity.name,
                wasRedirected:           false,
                legendaryResistanceUsed: false,
                outcome:                 { kind: 'behavior', effectName: 'Dodge', guardedName: null, rounds: 1 },
                appliedEffects:          [],
                concentrationSaveEvent:  null,
                summonedEntities:        [],
            };
        }

        // Help action
        if (targetEntityId === null) throw new Error('Help requires a target.');

        const [targetPart, targetEntity] = await Promise.all([
            this.db.activeCombat_Participant.findFirst({
                where:  { activeCombatId: combatId, entityId: targetEntityId, isDefeated: false, hasFled: false },
                select: { id: true, allyFactionId: true },
            }),
            this.db.entity.findUnique({
                where:  { id: targetEntityId },
                select: { name: true },
            }),
        ]);

        if (!targetPart || !targetEntity) throw new Error('Target is not an active participant.');
        if (targetEntityId === actorEntityId) throw new Error('You cannot Help yourself.');

        const isAlly    = targetPart.allyFactionId === actorPart.allyFactionId;
        const helpMod   = isAlly ? 'advantage' : 'disadvantage';

        const logged = await this.db.$transaction(async tx => {
            const log = await tx.activeCombat_Action.create({
                data: {
                    activeCombatId:   combatId,
                    roundNumber,
                    turnIndex:        existingCount + 1,
                    actorEntityId,
                    actionCategoryId: mainCategory?.id ?? null,
                    targetEntityId,
                },
                select: { id: true },
            });

            await tx.activeCombat_Participant.update({
                where: { id: targetPart.id },
                data:  { helpRollMod: helpMod },
            });

            return log;
        });

        const effectLabel = isAlly ? 'Help (Advantage)' : 'Help (Disadvantage)';
        return {
            actionId:                logged.id,
            actionLabel:             'Help',
            actorName:               actorEntity.name,
            targetName:              targetEntity.name,
            actualTargetName:        targetEntity.name,
            wasRedirected:           false,
            legendaryResistanceUsed: false,
            outcome:                 { kind: 'behavior', effectName: effectLabel, guardedName: null, rounds: 1 },
            appliedEffects:          [],
            concentrationSaveEvent:  null,
            summonedEntities:        [],
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

    // ── Mid-combat joins and summons ──────────────────────────────────────────

    async joinCombat(combatId: number, entityId: number, allyFactionId: number, roundNumber: number): Promise<SummonedEntity> {
        const [combat, entity, existing] = await Promise.all([
            this.db.activeCombat.findUnique({
                where:  { id: combatId },
                select: { isActive: true },
            }),
            this.db.entity.findUnique({
                where:  { id: entityId },
                select: { name: true },
            }),
            this.db.activeCombat_Participant.findUnique({
                where:  { activeCombatId_entityId: { activeCombatId: combatId, entityId } },
                select: { id: true },
            }),
        ]);
        if (!combat)        throw new Error(`Combat ${combatId} not found`);
        if (!combat.isActive) throw new Error('Combat is no longer active');
        if (!entity)        throw new Error(`Entity ${entityId} not found`);
        if (existing)       throw new Error(`Entity ${entityId} is already a participant in this combat`);

        // Wrap read+create atomically to prevent a race on @@unique([activeCombatId, turnOrder]).
        const turnOrder = await this.db.$transaction(async tx => {
            const last = await tx.activeCombat_Participant.findFirst({
                where:   { activeCombatId: combatId },
                orderBy: { turnOrder: 'desc' },
                select:  { turnOrder: true },
            });
            const next = (last?.turnOrder ?? 0) + 1;
            await tx.activeCombat_Participant.create({
                data: { activeCombatId: combatId, entityId, allyFactionId, turnOrder: next, joinedAtRound: roundNumber },
            });
            return next;
        });

        await this._seedPreCombatEffects(combatId, [entityId]);

        return { entityId, name: entity.name, allyFactionId, turnOrder };
    }

    private async _spawnNpcEntity(
        speciesId:     number,
        guildId:       string,
        combatId:      number,
        allyFactionId: number,
        roundNumber:   number,
        entityTypeId:  number,
        statusId:      number,
    ): Promise<SummonedEntity> {
        const species = await this.db.species.findUnique({
            where:  { id: speciesId },
            select: {
                name:             true,
                baseStrength:     true,
                baseDexterity:    true,
                baseConstitution: true,
                baseIntelligence: true,
                baseWisdom:       true,
                baseCharisma:     true,
                hpDiceCount:              true,
                hpDiceSides:              true,
                dropTableId:              true,
                legendaryResistancesMax:  true,
                defaultLoadout:   {
                    select: {
                        itemId:    true,
                        quantity:  true,
                        autoEquip: true,
                        item:      { select: { maxUses: true, maxDailyUses: true } },
                    },
                },
            },
        });
        if (!species) throw new Error(`Species ${speciesId} not found`);

        // For auto-equip items, look up the first profile per item so chosenProfileId can be set.
        const autoEquipItemIds = species.defaultLoadout.filter(l => l.autoEquip).map(l => l.itemId);
        const profileRows = autoEquipItemIds.length > 0
            ? await this.db.itemEquipmentProfile.findMany({
                where:   { itemId: { in: autoEquipItemIds } },
                select:  { id: true, itemId: true },
                orderBy: { id: 'asc' },
            })
            : [];
        const firstProfileByItemId = new Map<number, number>();
        for (const p of profileRows) {
            if (!firstProfileByItemId.has(p.itemId)) firstProfileByItemId.set(p.itemId, p.id);
        }

        // NPC HP uses the floor-average formula: floor(count * sides / 2) + CON mod.
        const conMod = Math.floor((species.baseConstitution - 10) / 2);
        const hp     = Math.max(1, Math.floor((species.hpDiceCount * species.hpDiceSides) / 2) + conMod);

        const spawned = await this.db.$transaction(async tx => {
            const entity = await tx.entity.create({
                data:   { guildId, name: species.name, statusId, typeId: entityTypeId, speciesId },
                select: { id: true, name: true },
            });

            const storage = await tx.storage.create({
                data:   { guildId, name: `${entity.name} Inventory` },
                select: { id: true },
            });

            await Promise.all([
                tx.entityStats.create({
                    data: {
                        entityId:     entity.id,
                        maxHp:        hp,
                        currentHp:    hp,
                        strength:     species.baseStrength,
                        dexterity:    species.baseDexterity,
                        constitution: species.baseConstitution,
                        intelligence: species.baseIntelligence,
                        wisdom:       species.baseWisdom,
                        charisma:     species.baseCharisma,
                    },
                }),
                tx.entity_Storage.create({ data: { entityId: entity.id, storageId: storage.id } }),
            ]);

            if (species.defaultLoadout.length > 0) {
                await tx.storedItem.createMany({
                    data: species.defaultLoadout.map(l => {
                        const chosenProfileId = l.autoEquip ? (firstProfileByItemId.get(l.itemId) ?? null) : null;
                        return {
                            storageId:          storage.id,
                            itemId:             l.itemId,
                            quantity:           l.quantity,
                            isEquipped:         l.autoEquip,
                            chosenProfileId,
                            equippedAt:         l.autoEquip ? new Date() : null,
                            usesRemaining:      l.item.maxUses      ? l.item.maxUses      : null,
                            dailyUsesRemaining: l.item.maxDailyUses ? l.item.maxDailyUses : null,
                        };
                    }),
                });
            }

            const last = await tx.activeCombat_Participant.findFirst({
                where:   { activeCombatId: combatId },
                orderBy: { turnOrder: 'desc' },
                select:  { turnOrder: true },
            });
            const turnOrder = (last?.turnOrder ?? 0) + 1;

            await tx.activeCombat_Participant.create({
                data: {
                    activeCombatId:               combatId,
                    entityId:                     entity.id,
                    allyFactionId,
                    turnOrder,
                    isAiControlled:               true,
                    joinedAtRound:                roundNumber,
                    dropTableId:                  species.dropTableId ?? null,
                    legendaryResistancesRemaining: species.legendaryResistancesMax ?? null,
                },
            });

            return { entityId: entity.id, name: entity.name, turnOrder };
        });

        await this._seedPreCombatEffects(combatId, [spawned.entityId]);

        return { entityId: spawned.entityId, name: spawned.name, allyFactionId, turnOrder: spawned.turnOrder };
    }

    private async _executeSummons(
        speciesId:     number,
        diceCount:     number | null,
        diceSides:     number | null,
        guildId:       string,
        combatId:      number,
        allyFactionId: number,
        roundNumber:   number,
    ): Promise<SummonedEntity[]> {
        const [entityType, status] = await Promise.all([
            this.db.entityType.findFirst({ where: { name: 'NPC' },    select: { id: true } }),
            this.db.status.findFirst(    { where: { name: 'Active' }, select: { id: true } }),
        ]);
        if (!entityType) throw new Error('EntityType "NPC" not found');
        if (!status)     throw new Error('Status "Active" not found');

        const count = (diceCount && diceSides)
            ? rollDice(diceCount, diceSides, defaultRoller).reduce((a, b) => a + b, 0)
            : 1;
        const results: SummonedEntity[] = [];
        for (let i = 0; i < count; i++) {
            results.push(await this._spawnNpcEntity(speciesId, guildId, combatId, allyFactionId, roundNumber, entityType.id, status.id));
        }
        return results;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private _toActionResult(ctx: CombatActionContext): ActionResult {
        let outcome: ActionResultOutcome;

        if (ctx.profile?.dealsDamage) {
            if (ctx.isHit === true) {
                outcome = {
                    kind:                    'hit',
                    hitRoll:                 ctx.hitTotal!,
                    targetAC:                ctx.targetAC,
                    isCritical:              ctx.isCritical,
                    diceRolls:               ctx.diceRolls,
                    totalDamage:             ctx.finalDamage,
                    damageTypeName:          ctx.profile?.damageTypeName          ?? null,
                    elementalDiceRolls:      ctx.elementalDiceRolls,
                    totalElementalDamage:    ctx.finalElementalDamage,
                    elementalDamageTypeName: ctx.profile?.elementalDamageTypeName ?? null,
                    absorbedDamage:          ctx.absorbedDamage,
                    tempHpDrained:           ctx.tempHpDrained,
                    saveRoll:                ctx.saveRoll,
                    saveTotal:               ctx.saveTotal,
                    savedSuccessfully:       ctx.savedSuccessfully,
                    hpAfter:                 ctx.hpAfter ?? 0,
                    knockedDown:             ctx.knockedDown,
                    defeated:                ctx.defeated,
                };
            } else {
                outcome = { kind: 'miss', hitRoll: ctx.hitTotal!, targetAC: ctx.targetAC, isFumble: ctx.isFumble };
            }
        } else if (ctx.profile?.restoresHealth) {
            outcome = {
                kind:      'heal',
                diceRolls: ctx.diceRolls,
                totalHeal: ctx.finalHeal,
                hpAfter:   ctx.hpAfter ?? ctx.target?.currentHp ?? 0,
            };
        } else if (ctx.appliedBehaviorEffect) {
            outcome = { kind: 'behavior', ...ctx.appliedBehaviorEffect };
        } else {
            outcome = { kind: 'no_op' };
        }

        // Secondary effects shown alongside a damage/heal outcome go in appliedEffects.
        // If the primary outcome is already 'behavior', its name is in the outcome itself.
        const appliedEffects: string[] = [...ctx.appliedStatEffectNames];
        if (ctx.appliedBehaviorEffect && outcome.kind !== 'behavior') {
            appliedEffects.push(ctx.appliedBehaviorEffect.effectName);
        }

        const targetName = ctx.wasRedirected
            ? (ctx.originalTargetName ?? ctx.target?.name ?? 'Unknown')
            : (ctx.target?.name ?? 'Unknown');

        return {
            actionId:               ctx.actionId ?? 0,
            actionLabel:            ctx.profile?.label ?? 'Unknown',
            actorName:              ctx.actor?.name ?? 'Unknown',
            targetName,
            actualTargetName:       ctx.target?.name ?? 'Unknown',
            wasRedirected:          ctx.wasRedirected,
            legendaryResistanceUsed: ctx.legendaryResistanceUsed,
            outcome,
            appliedEffects,
            pendingReaction:        ctx.pendingReaction ?? undefined,
            concentrationSaveEvent: ctx.concentrationSaveEvent ?? null,
            summonedEntities:       [],
        };
    }

    private async _processTurnEnd(participantId: number, usesDeathSaves: boolean): Promise<RoundEndEvent[]> {
        // Fetch both in parallel — the tick transaction doesn't touch participant HP or metadata.
        const [activeEffects, participant] = await Promise.all([
            this.db.activeCombat_StatEffect.findMany({
                where:   { affectedParticipantId: participantId },
                orderBy: { id: 'asc' },
                select: {
                    effectDef: {
                        select: {
                            damageOverTime: { select: { diceCount: true, diceSides: true, flatDamage: true } },
                            healOverTime:   { select: { diceCount: true, diceSides: true, flatHeal: true } },
                        },
                    },
                },
            }),
            this.db.activeCombat_Participant.findUnique({
                where:  { id: participantId },
                select: {
                    entityId:                true,
                    isAiControlled:          true,
                    isUnconscious:           true,
                    concentratingOnEffectId: true,
                    entity: { select: { name: true, stats: { select: { currentHp: true, maxHp: true } } } },
                },
            }),
        ]);

        await this.db.$transaction([
            this.db.activeCombat_Participant_ActionCooldown.deleteMany({
                where: { participantId, roundsRemaining: 1 },
            }),
            this.db.activeCombat_Participant_ActionCooldown.updateMany({
                where: { participantId, roundsRemaining: { gt: 1 } },
                data:  { roundsRemaining: { decrement: 1 } },
            }),
            this.db.activeCombat_StatEffect.deleteMany({
                where: { affectedParticipantId: participantId, roundsRemaining: 1 },
            }),
            this.db.activeCombat_StatEffect.updateMany({
                where: { affectedParticipantId: participantId, roundsRemaining: { gt: 1 } },
                data:  { roundsRemaining: { decrement: 1 } },
            }),
        ]);

        const hasDotOrHot = activeEffects.some(
            e => e.effectDef.damageOverTime.length > 0 || e.effectDef.healOverTime.length > 0,
        );
        if (!hasDotOrHot) return [];
        if (!participant) return [];

        let currentHp = participant.entity.stats?.currentHp ?? 0;
        const maxHp   = participant.entity.stats?.maxHp     ?? 0;
        const events: RoundEndEvent[] = [];

        // Accumulate all tick results first; write HP once at the end (or immediately on defeat).
        for (const effect of activeEffects) {
            for (const dot of effect.effectDef.damageOverTime) {
                const rolls  = rollDice(dot.diceCount, dot.diceSides, defaultRoller);
                const amount = Math.max(0, rolls.reduce((a, b) => a + b, 0) + dot.flatDamage);
                currentHp   -= amount;

                if (currentHp <= 0) {
                    // Eligible for death saves if player-controlled, combat allows it, and not already saving.
                    const canStartDeathSaves = !participant.isAiControlled && usesDeathSaves && !participant.isUnconscious;
                    if (canStartDeathSaves) {
                        const concentratingId = participant.concentratingOnEffectId;
                        await this.db.$transaction(async tx => {
                            await tx.entityStats.update({
                                where: { entityId: participant.entityId },
                                data:  { currentHp: 0 },
                            });
                            await tx.activeCombat_Participant.update({
                                where: { id: participantId },
                                data:  { isUnconscious: true, deathSaveSuccesses: 0, deathSaveFailures: 0, concentratingOnEffectId: null },
                            });
                            if (concentratingId) {
                                await tx.activeCombat_BehaviorEffect.delete({
                                    where: { id: concentratingId },
                                }).catch(() => null);
                            }
                        });
                        events.push({ kind: 'dot', entityId: participant.entityId, entityName: participant.entity.name, amount, hpAfter: 0, defeated: false, knockedDown: true });
                    } else {
                        await this.db.$transaction([
                            this.db.entityStats.update({
                                where: { entityId: participant.entityId },
                                data:  { currentHp: 0 },
                            }),
                            this.db.activeCombat_Participant.update({
                                where: { id: participantId },
                                data:  { isDefeated: true },
                            }),
                            this.db.activeCombat_BehaviorEffect.deleteMany({
                                where: { sourceParticipantId: participantId },
                            }),
                            this.db.activeCombat_StatEffect.deleteMany({
                                where: { affectedParticipantId: participantId },
                            }),
                        ]);
                        events.push({ kind: 'dot', entityId: participant.entityId, entityName: participant.entity.name, amount, hpAfter: 0, defeated: true, knockedDown: false });
                    }
                    return events;
                }

                events.push({ kind: 'dot', entityId: participant.entityId, entityName: participant.entity.name, amount, hpAfter: currentHp, defeated: false, knockedDown: false });
            }

            for (const hot of effect.effectDef.healOverTime) {
                const rolls      = rollDice(hot.diceCount, hot.diceSides, defaultRoller);
                const raw        = rolls.reduce((a, b) => a + b, 0) + hot.flatHeal;
                const actualHeal = Math.min(Math.max(0, raw), maxHp - currentHp);
                currentHp       += actualHeal;

                if (actualHeal > 0) {
                    events.push({ kind: 'hot', entityId: participant.entityId, entityName: participant.entity.name, amount: actualHeal, hpAfter: currentHp, defeated: false, knockedDown: false });
                }
            }
        }

        // Single HP write covering all DoT/HoT ticks for the turn.
        if (events.length > 0) {
            await this.db.entityStats.update({
                where: { entityId: participant.entityId },
                data:  { currentHp },
            });
            if (participant.isUnconscious && currentHp > 0) {
                await this.db.activeCombat_Participant.update({
                    where: { id: participantId },
                    data:  { isUnconscious: false, deathSaveSuccesses: 0, deathSaveFailures: 0 },
                });
            }
        }

        return events;
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
            if (threshold <= 0) break;
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

    private async _seedPreCombatEffects(combatId: number, entityIds: number[]): Promise<void> {
        const [preCombatEffects, dbParticipants] = await Promise.all([
            this.db.entity_PreCombatEffect.findMany({
                where:  { entityId: { in: entityIds }, expiresAt: { gt: new Date() } },
                select: {
                    entityId:          true,
                    effectDefId:       true,
                    equipmentProfileId: true,
                    effectDef: {
                        select: {
                            durationRounds: true,
                            stackBehavior:  { select: { name: true } },
                        },
                    },
                    equipmentProfile: { select: { cooldownRounds: true } },
                },
            }),
            this.db.activeCombat_Participant.findMany({
                where:  { activeCombatId: combatId },
                select: { id: true, entityId: true },
            }),
        ]);

        if (preCombatEffects.length === 0) return;

        const participantMap = new Map(dbParticipants.map(p => [p.entityId, p.id]));

        // Group effects by participant so we can batch per-participant DB operations.
        const effectsByParticipant = new Map<number, typeof preCombatEffects>();
        for (const effect of preCombatEffects) {
            const participantId = participantMap.get(effect.entityId);
            if (!participantId) continue;
            if (!effectsByParticipant.has(participantId)) effectsByParticipant.set(participantId, []);
            effectsByParticipant.get(participantId)!.push(effect);
        }

        await Promise.all([...effectsByParticipant].map(async ([participantId, effects]) => {
            const effectDefIds = effects.map(e => e.effectDefId);

            const existing = await this.db.activeCombat_StatEffect.findMany({
                where:  { activeCombatId: combatId, affectedParticipantId: participantId, effectDefId: { in: effectDefIds } },
                select: { effectDefId: true },
            });
            const existingDefIds = new Set(existing.map(e => e.effectDefId));

            const refreshDefIds = effects
                .filter(e => e.effectDef.stackBehavior.name === 'refresh' && existingDefIds.has(e.effectDefId))
                .map(e => e.effectDefId);
            if (refreshDefIds.length > 0) {
                await this.db.activeCombat_StatEffect.deleteMany({
                    where: { activeCombatId: combatId, affectedParticipantId: participantId, effectDefId: { in: refreshDefIds } },
                });
            }

            const toCreate = effects.filter(e =>
                !(e.effectDef.stackBehavior.name === 'ignore' && existingDefIds.has(e.effectDefId)),
            );

            if (toCreate.length > 0) {
                await this.db.activeCombat_StatEffect.createMany({
                    data: toCreate.map(e => {
                        const rounds = e.effectDef.durationRounds;
                        return {
                            activeCombatId:        combatId,
                            effectDefId:           e.effectDefId,
                            affectedParticipantId: participantId,
                            roundsRemaining:       rounds && rounds > 0 ? rounds : null,
                        };
                    }),
                });
            }

            // Prisma has no upsertMany — run cooldown upserts in parallel.
            const cooldownEffects = toCreate.filter(e =>
                e.equipmentProfileId && (e.equipmentProfile?.cooldownRounds ?? 0) > 0,
            );
            if (cooldownEffects.length > 0) {
                await Promise.all(cooldownEffects.map(e =>
                    this.db.activeCombat_Participant_ActionCooldown.upsert({
                        where:  { participantId_equipmentProfileId: { participantId, equipmentProfileId: e.equipmentProfileId! } },
                        create: { participantId, equipmentProfileId: e.equipmentProfileId!, roundsRemaining: e.equipmentProfile!.cooldownRounds },
                        update: { roundsRemaining: e.equipmentProfile!.cooldownRounds },
                    }),
                ));
            }
        }));
    }

    private async _getActionEnergyCost(guildId: string, mode: 'spar' | 'fight'): Promise<number> {
        const config = await this.db.guild_ActionConfig.findFirst({
            where:  { guildId, actionType: { name: mode } },
            select: { energyCost: true },
        });
        return config?.energyCost ?? 0;
    }
}
