import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Writes the action log record, applies cooldowns, decrements item uses,
// and applies behavior/stat effects produced by the action.
export async function runEnd(ctx: CombatActionContext, { db }: PipelineServices): Promise<void> {
    const { input, profile } = ctx;
    if (!profile) return;

    const action = await db.activeCombat_Action.create({
        data: {
            activeCombatId:     input.combatId,
            roundNumber:        input.roundNumber,
            turnIndex:          ctx.existingActionCount + 1,
            actorEntityId:      input.actorEntityId,
            actionCategoryId:   profile.actionCategoryId,
            equipmentProfileId: input.profileId,
            targetEntityId:     ctx.actualTargetId ?? null,
            ...(ctx.hitRoll    !== null ? { hitRoll: ctx.hitRoll, hitModifier: ctx.hitModifier }                                       : {}),
            ...(ctx.isHit      !== null ? { hit: ctx.isHit, isCritical: ctx.isCritical }                                              : {}),
            ...(ctx.finalDamage        > 0 ? { damageRoll: ctx.rawDamage, damageModifier: ctx.damageModifier, damageDealt: ctx.finalDamage } : {}),
            ...(ctx.finalElementalDamage > 0 ? { elementalDamageDealt: ctx.finalElementalDamage }                                     : {}),
            ...(ctx.finalHeal          > 0 ? { healDealt: ctx.finalHeal }                                                             : {}),
            ...(ctx.knockedDown        ? { secondWindTriggered: true }                                                                 : {}),
        },
        select: { id: true },
    });
    ctx.actionId = action.id;

    if (profile.cooldownRounds > 0 && ctx.actorParticipantId !== null) {
        await db.activeCombat_Participant_ActionCooldown.upsert({
            where:  { participantId_equipmentProfileId: { participantId: ctx.actorParticipantId, equipmentProfileId: input.profileId } },
            create: { participantId: ctx.actorParticipantId, equipmentProfileId: input.profileId, roundsRemaining: profile.cooldownRounds },
            update: { roundsRemaining: profile.cooldownRounds },
        });
    }

    await Promise.all([
        db.storedItem.updateMany({
            where: { id: input.storedItemId, usesRemaining:      { not: null } },
            data:  { usesRemaining:      { decrement: 1 } },
        }),
        db.storedItem.updateMany({
            where: { id: input.storedItemId, dailyUsesRemaining: { not: null } },
            data:  { dailyUsesRemaining: { decrement: 1 } },
        }),
    ]);

    // ── Behavior effect ───────────────────────────────────────────────────────
    if (profile.behaviorEffectTypeId && profile.durationRounds > 0 && ctx.actorParticipantId !== null
        && (!profile.dealsDamage || ctx.isHit)) {
        // guard:  actor is the guardian; target is the entity being protected
        // taunt:  target is the taunted entity; actor is the taunter
        // others: actor applies the effect to themselves
        const isGuard = profile.behaviorEffectRedirectsDamage;
        const isTaunt = profile.behaviorEffectForcesTargeting;

        const affectedId = isTaunt
            ? (ctx.targetParticipant?.id ?? ctx.actorParticipantId)
            : isGuard
                ? ctx.actorParticipantId
                : (ctx.targetParticipant?.id ?? ctx.actorParticipantId);

        const linkedId = isGuard
            ? (ctx.targetParticipant?.id ?? null)
            : isTaunt
                ? ctx.actorParticipantId
                : null;

        await db.activeCombat_BehaviorEffect.upsert({
            where:  { affectedParticipantId_effectTypeId: { affectedParticipantId: affectedId, effectTypeId: profile.behaviorEffectTypeId } },
            create: {
                activeCombatId:        input.combatId,
                effectTypeId:          profile.behaviorEffectTypeId,
                affectedParticipantId: affectedId,
                linkedParticipantId:   linkedId,
                sourceParticipantId:   ctx.actorParticipantId,
                roundsRemaining:       profile.durationRounds,
                flatModifier:          profile.flatModifier,
                percentModifier:       profile.percentModifier,
            },
            update: {
                linkedParticipantId: linkedId,
                sourceParticipantId: ctx.actorParticipantId,
                roundsRemaining:     profile.durationRounds,
                flatModifier:        profile.flatModifier,
                percentModifier:     profile.percentModifier,
            },
        });

        ctx.appliedBehaviorEffect = {
            effectName:  profile.behaviorEffectName ?? 'Unknown',
            guardedName: isGuard ? (ctx.target?.name ?? null) : null,
            rounds:      profile.durationRounds,
        };
    }

    // ── Stat effects ──────────────────────────────────────────────────────────
    if (ctx.targetParticipant && ctx.actorParticipantId !== null
        && (!profile.dealsDamage || ctx.isHit)) {
        const profileStatEffects = await db.itemEquipmentProfile_StatEffect.findMany({
            where:  { equipmentProfileId: input.profileId },
            select: {
                effectDefId:       true,
                applicationChance: true,
                effectDef: {
                    select: {
                        displayName:    true,
                        durationRounds: true,
                        stackBehavior:  { select: { name: true } },
                    },
                },
            },
        });

        for (const row of profileStatEffects) {
            if (Math.random() > row.applicationChance) continue;

            const stack         = row.effectDef.stackBehavior.name;
            const targetPartId  = ctx.targetParticipant.id;
            const roundsRemaining = row.effectDef.durationRounds ?? null;

            if (stack === 'ignore') {
                const existing = await db.activeCombat_StatEffect.findFirst({
                    where: { affectedParticipantId: targetPartId, effectDefId: row.effectDefId },
                    select: { id: true },
                });
                if (existing) continue;
            } else if (stack === 'refresh') {
                await db.activeCombat_StatEffect.deleteMany({
                    where: { affectedParticipantId: targetPartId, effectDefId: row.effectDefId },
                });
            }
            // 'stack' falls through to create without deleting

            await db.activeCombat_StatEffect.create({
                data: {
                    activeCombatId:        input.combatId,
                    effectDefId:           row.effectDefId,
                    affectedParticipantId: targetPartId,
                    sourceParticipantId:   ctx.actorParticipantId,
                    appliedByActionId:     ctx.actionId,
                    roundsRemaining,
                },
            });

            ctx.appliedStatEffectNames.push(row.effectDef.displayName);
        }
    }
}
