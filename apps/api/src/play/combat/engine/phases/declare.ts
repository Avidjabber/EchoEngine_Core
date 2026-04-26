import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Loads actor, profile, and combat meta from DB. All reads for the actor side happen here.
export async function runDeclare(ctx: CombatActionContext, { db }: PipelineServices): Promise<void> {
    const [profileRow, combatRow, actorRow, existingCount, actorParticipantRow] = await Promise.all([
        db.itemEquipmentProfile.findUnique({
            where:  { id: ctx.input.profileId },
            select: {
                label:            true,
                actionCategoryId: true,
                cooldownRounds:   true,
                hitBonus:         true,
                damageBonus:      true,
                healBonus:        true,
                damageDiceCount:  true,
                damageDiceSides:  true,
                healDiceCount:    true,
                healDiceSides:    true,
                hitStat:             { select: { name: true } },
                damageStat:          { select: { name: true } },
                healStat:            { select: { name: true } },
                savingThrowStat:     { select: { name: true } },
                saveDC:              true,
                summonSpeciesId:     true,
                summonDiceCount:     true,
                summonDiceSides:     true,
                actionType:          { select: { dealsDamage: true, restoresHealth: true } },
                damageType:          { select: { id: true, name: true } },
                elementalDiceCount:  true,
                elementalDiceSides:  true,
                elementalDamageType: { select: { id: true, name: true } },
                isReactionAction:    true,
                durationRounds:      true,
                flatModifier:        true,
                percentModifier:     true,
                behaviorEffectType:  { select: { id: true, name: true, redirectsDamage: true, forcesTargeting: true, removesEffects: true, isConcentration: true } },
                targetScope:         { select: { targetsSelf: true, targetsSingle: true, targetsAllies: true, targetsEnemies: true } },
            },
        }),
        db.activeCombat.findUnique({
            where:  { id: ctx.input.combatId },
            select: { currentTurnOrder: true, initiationType: { select: { usesDeathSaves: true, name: true } } },
        }),
        db.entity.findUnique({
            where:  { id: ctx.input.actorEntityId },
            select: {
                name:  true,
                stats: {
                    select: {
                        strength:     true,
                        dexterity:    true,
                        constitution: true,
                        intelligence: true,
                        wisdom:       true,
                        charisma:     true,
                    },
                },
            },
        }),
        db.activeCombat_Action.count({
            where: { activeCombatId: ctx.input.combatId, roundNumber: ctx.input.roundNumber },
        }),
        db.activeCombat_Participant.findFirst({
            where:  { activeCombatId: ctx.input.combatId, entityId: ctx.input.actorEntityId },
            select: { id: true, turnOrder: true, helpRollMod: true, concentratingOnEffectId: true },
        }),
    ]);

    if (profileRow) {
        ctx.profile = {
            label:            profileRow.label,
            actionCategoryId: profileRow.actionCategoryId,
            cooldownRounds:   profileRow.cooldownRounds,
            hitBonus:         profileRow.hitBonus,
            damageBonus:      profileRow.damageBonus,
            healBonus:        profileRow.healBonus,
            damageDiceCount:  profileRow.damageDiceCount,
            damageDiceSides:  profileRow.damageDiceSides,
            healDiceCount:    profileRow.healDiceCount,
            healDiceSides:    profileRow.healDiceSides,
            isReactionAction:        profileRow.isReactionAction,
            dealsDamage:             profileRow.actionType?.dealsDamage    ?? false,
            restoresHealth:          profileRow.actionType?.restoresHealth ?? false,
            hitStatName:             profileRow.hitStat?.name          ?? null,
            damageStatName:          profileRow.damageStat?.name       ?? null,
            healStatName:            profileRow.healStat?.name         ?? null,
            savingThrowStatName:     profileRow.savingThrowStat?.name  ?? null,
            saveDC:                  profileRow.saveDC,
            summonSpeciesId:         profileRow.summonSpeciesId ?? null,
            summonDiceCount:         profileRow.summonDiceCount ?? null,
            summonDiceSides:         profileRow.summonDiceSides ?? null,
            targetsSelf:             profileRow.targetScope?.targetsSelf    ?? false,
            targetsSingle:           profileRow.targetScope?.targetsSingle  ?? false,
            targetsAllies:           profileRow.targetScope?.targetsAllies  ?? false,
            targetsEnemies:          profileRow.targetScope?.targetsEnemies ?? false,
            damageTypeId:            profileRow.damageType?.id            ?? null,
            damageTypeName:          profileRow.damageType?.name          ?? null,
            elementalDiceCount:      profileRow.elementalDiceCount        ?? null,
            elementalDiceSides:      profileRow.elementalDiceSides        ?? null,
            elementalDamageTypeId:   profileRow.elementalDamageType?.id   ?? null,
            elementalDamageTypeName: profileRow.elementalDamageType?.name ?? null,
            behaviorEffectTypeId:          profileRow.behaviorEffectType?.id             ?? null,
            behaviorEffectName:            profileRow.behaviorEffectType?.name           ?? null,
            behaviorEffectRedirectsDamage: profileRow.behaviorEffectType?.redirectsDamage ?? false,
            behaviorEffectForcesTargeting: profileRow.behaviorEffectType?.forcesTargeting ?? false,
            behaviorEffectRemovesEffects:  profileRow.behaviorEffectType?.removesEffects  ?? false,
            requiresConcentration:         profileRow.behaviorEffectType?.isConcentration ?? false,
            durationRounds:                profileRow.durationRounds,
            flatModifier:                  profileRow.flatModifier   ?? null,
            percentModifier:               profileRow.percentModifier ?? null,
        };
    }

    if (combatRow) {
        ctx.combatMeta = {
            usesDeathSaves:    combatRow.initiationType.usesDeathSaves,
            currentTurnOrder: combatRow.currentTurnOrder,
            isSpar:           combatRow.initiationType.name === 'spar',
        };
    }

    if (actorParticipantRow) {
        ctx.actorTurnOrder     = actorParticipantRow.turnOrder;
        ctx.actorParticipantId = actorParticipantRow.id;
        ctx.actorParticipant   = {
            helpRollMod:             (actorParticipantRow.helpRollMod as 'advantage' | 'disadvantage' | null) ?? null,
            concentratingOnEffectId: actorParticipantRow.concentratingOnEffectId ?? null,
        };
    }

    if (actorRow) {
        ctx.actor = {
            name:  actorRow.name,
            stats: {
                strength:     actorRow.stats?.strength     ?? 10,
                dexterity:    actorRow.stats?.dexterity    ?? 10,
                constitution: actorRow.stats?.constitution ?? 10,
                intelligence: actorRow.stats?.intelligence ?? 10,
                wisdom:       actorRow.stats?.wisdom       ?? 10,
                charisma:     actorRow.stats?.charisma     ?? 10,
            },
        };
    }

    ctx.existingActionCount = existingCount;
}
