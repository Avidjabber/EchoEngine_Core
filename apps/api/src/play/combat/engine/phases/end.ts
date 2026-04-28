import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';
import { rollDice } from '../../../../utils/dice';

// Writes the action log record, applies cooldowns, decrements item uses,
// and applies behavior/stat effects produced by the action.
// All writes are wrapped in a single transaction so a mid-phase failure
// cannot leave combat state partially written.
export async function runEnd(ctx: CombatActionContext, { db, roller }: PipelineServices): Promise<void> {
    const { input, profile } = ctx;
    if (!profile) return;

    const targetPartId = ctx.targetParticipant?.id ?? null;
    const canApplyEffects = targetPartId !== null
        && ctx.actorParticipantId !== null
        && (!profile.dealsDamage || ctx.isHit);

    // Load stat effect definitions before the transaction — static config, safe to read outside.
    const profileStatEffects = canApplyEffects
        ? await db.itemEquipmentProfile_StatEffect.findMany({
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
        })
        : [];

    // Apply probability rolls outside the transaction — safe to read outside since it's pure randomness.
    const rolledEffects = profileStatEffects.filter(r => rollDice(1, 100, roller)[0]! / 100 <= r.applicationChance);

    await db.$transaction(async tx => {
        // ── Action log ────────────────────────────────────────────────────────
        const action = await tx.activeCombat_Action.create({
            data: {
                activeCombatId:     input.combatId,
                roundNumber:        input.roundNumber,
                turnIndex:          ctx.existingActionCount + 1,
                actorEntityId:      input.actorEntityId,
                actionCategoryId:   profile.actionCategoryId,
                equipmentProfileId: input.profileId,
                targetEntityId:     ctx.actualTargetId ?? null,
                ...(ctx.hitRoll    !== null ? { hitRoll: ctx.hitRoll, hitModifier: ctx.hitModifier }                                       : {}),
                ...(ctx.isHit      !== null ? { hit: ctx.isHit, isCritical: ctx.isCritical, isFumble: ctx.isFumble }                    : {}),
                ...(ctx.finalDamage        > 0 ? { damageRoll: ctx.rawDamage, damageModifier: ctx.damageModifier, damageDealt: ctx.finalDamage } : {}),
                ...(ctx.finalElementalDamage > 0 ? { elementalDamageRoll: ctx.rawElementalDamage, elementalDamageDealt: ctx.finalElementalDamage } : {}),
                ...(ctx.wasRedirected ? { wasRedirected: true, originalTargetEntityId: ctx.input.targetEntityId }                           : {}),
                ...(ctx.finalHeal          > 0 ? { healDealt: ctx.finalHeal }                                                             : {}),
                ...(ctx.knockedDown        ? { knockedDown: true }                                                                        : {}),
                ...(ctx.absorbedDamage     > 0    ? { absorbedDamage: ctx.absorbedDamage }                                              : {}),
                ...(ctx.saveRoll          !== null ? { saveRoll: ctx.saveRoll, savedSuccessfully: ctx.savedSuccessfully ?? false }        : {}),
            },
            select: { id: true },
        });
        ctx.actionId = action.id;

        // ── Legendary resistance charge ───────────────────────────────────────
        if (ctx.legendaryResistanceUsed && ctx.targetParticipant !== null) {
            await tx.activeCombat_Participant.update({
                where: { id: ctx.targetParticipant.id },
                data:  { legendaryResistancesRemaining: { decrement: 1 } },
            });
        }

        // ── Cooldown + item uses ──────────────────────────────────────────────
        // Skipped for AoE follow-up targets (aoeIndex > 0) — these are tracked
        // once on the first pipeline run (aoeIndex = 0 or null) only.
        const sideWrites: Promise<unknown>[] = [];
        if (ctx.helpConsumed && ctx.actorParticipantId !== null) {
            sideWrites.push(
                tx.activeCombat_Participant.update({
                    where: { id: ctx.actorParticipantId },
                    data:  { helpRollMod: null },
                }),
            );
        }
        if (input.aoeIndex === null || input.aoeIndex === 0) {
            sideWrites.push(
                tx.storedItem.updateMany({
                    where: { id: input.storedItemId, usesRemaining:      { not: null } },
                    data:  { usesRemaining:      { decrement: 1 } },
                }),
                tx.storedItem.updateMany({
                    where: { id: input.storedItemId, dailyUsesRemaining: { not: null } },
                    data:  { dailyUsesRemaining: { decrement: 1 } },
                }),
            );
            if (profile.cooldownRounds > 0 && ctx.actorParticipantId !== null) {
                sideWrites.push(tx.activeCombat_Participant_ActionCooldown.upsert({
                    where:  { participantId_equipmentProfileId: { participantId: ctx.actorParticipantId, equipmentProfileId: input.profileId } },
                    create: { participantId: ctx.actorParticipantId, equipmentProfileId: input.profileId, roundsRemaining: profile.cooldownRounds },
                    update: { roundsRemaining: profile.cooldownRounds },
                }));
            }
        }
        if (sideWrites.length > 0) await Promise.all(sideWrites);

        // ── Behavior effect ───────────────────────────────────────────────────
        // For damage actions: save halves damage but does not skip the effect.
        // For non-damage actions: a successful save skips the effect entirely.
        // Skip entirely if the target was just defeated — effects on a dead participant are orphaned.
        if (ctx.defeated) return;
        const isGuard = profile.behaviorEffectRedirectsDamage;
        const isTaunt = profile.behaviorEffectForcesTargeting;
        // Guards apply to the actor (self-buff); taunts apply to the target (forced targeting).
        // Normal effects apply to the target only — no actor fallback when target is absent.
        const affectedId = isGuard
            ? ctx.actorParticipantId
            : isTaunt
                ? (ctx.targetParticipant?.id ?? ctx.actorParticipantId)
                : ctx.targetParticipant?.id ?? null;

        if (profile.behaviorEffectTypeId && profile.durationRounds > 0 && ctx.actorParticipantId !== null
            && affectedId !== null
            && (!profile.dealsDamage || ctx.isHit)
            && (profile.dealsDamage  || !ctx.savedSuccessfully)) {

            const linkedId = isGuard
                ? (ctx.targetParticipant?.id ?? null)
                : isTaunt
                    ? ctx.actorParticipantId
                    : null;

            // Concentration: break the actor's prior concentration before applying the new effect.
            // This prevents two concentration effects from being active at once.
            const priorConcentrationId = profile.requiresConcentration ? (ctx.actorParticipant?.concentratingOnEffectId ?? null) : null;
            if (priorConcentrationId !== null) {
                await tx.activeCombat_BehaviorEffect.delete({
                    where: { id: priorConcentrationId },
                }).catch(() => null);
            }

            const newEffect = await tx.activeCombat_BehaviorEffect.upsert({
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
                select: { id: true },
            });

            // Concentration: link the new effect to the actor so concentration saves know what to check.
            if (profile.requiresConcentration) {
                await tx.activeCombat_Participant.update({
                    where: { id: ctx.actorParticipantId },
                    data:  { concentratingOnEffectId: newEffect.id },
                });
            }

            ctx.appliedBehaviorEffect = {
                effectName:  profile.behaviorEffectName ?? 'Unknown',
                guardedName: isGuard ? (ctx.target?.name ?? null) : null,
                rounds:      profile.durationRounds,
            };
        }

        // ── Stat effects ──────────────────────────────────────────────────────
        // Non-damage actions: a successful save skips stat effects (same rule as behavior effects above).
        if (rolledEffects.length > 0 && targetPartId !== null && (profile.dealsDamage || !ctx.savedSuccessfully)) {
            const effectDefIds = rolledEffects.map(r => r.effectDefId);

            // Single query to find all pre-existing instances for these defs.
            const existing = await tx.activeCombat_StatEffect.findMany({
                where:  { affectedParticipantId: targetPartId, effectDefId: { in: effectDefIds } },
                select: { effectDefId: true },
            });
            const existingDefIds = new Set(existing.map(e => e.effectDefId));

            // Batch-delete all effects that should refresh before recreation.
            const refreshDefIds = rolledEffects
                .filter(r => r.effectDef.stackBehavior.name === 'refresh' && existingDefIds.has(r.effectDefId))
                .map(r => r.effectDefId);
            if (refreshDefIds.length > 0) {
                await tx.activeCombat_StatEffect.deleteMany({
                    where: { affectedParticipantId: targetPartId, effectDefId: { in: refreshDefIds } },
                });
            }

            // Drop ignore effects that already exist; everything else is created.
            const toCreate = rolledEffects.filter(r =>
                !(r.effectDef.stackBehavior.name === 'ignore' && existingDefIds.has(r.effectDefId)),
            );

            if (toCreate.length > 0) {
                await tx.activeCombat_StatEffect.createMany({
                    data: toCreate.map(r => ({
                        activeCombatId:        input.combatId,
                        effectDefId:           r.effectDefId,
                        affectedParticipantId: targetPartId,
                        sourceParticipantId:   ctx.actorParticipantId!,
                        appliedByActionId:     action.id,
                        roundsRemaining:       r.effectDef.durationRounds && r.effectDef.durationRounds > 0
                            ? r.effectDef.durationRounds : null,
                    })),
                });
                for (const r of toCreate) ctx.appliedStatEffectNames.push(r.effectDef.displayName);
            }
        }

        // ── Reaction tracking ─────────────────────────────────────────────────
        // Mark the defender's reaction slot consumed as soon as a reaction prompt is issued
        // so a second attack in the same round cannot offer them another reaction.
        if (ctx.pendingReaction !== null && ctx.targetParticipant !== null) {
            await tx.activeCombat_Participant.update({
                where: { id: ctx.targetParticipant.id },
                data:  { hasUsedReaction: true },
            });
        }
    });
}
