import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Writes the action log record, applies cooldowns, and decrements item uses.
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

    if (profile.cooldownRounds > 0) {
        const actorPart = await db.activeCombat_Participant.findUnique({
            where:  { activeCombatId_entityId: { activeCombatId: input.combatId, entityId: input.actorEntityId } },
            select: { id: true },
        });
        if (actorPart) {
            await db.activeCombat_Participant_ActionCooldown.upsert({
                where:  { participantId_equipmentProfileId: { participantId: actorPart.id, equipmentProfileId: input.profileId } },
                create: { participantId: actorPart.id, equipmentProfileId: input.profileId, roundsRemaining: profile.cooldownRounds },
                update: { roundsRemaining: profile.cooldownRounds },
            });
        }
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
}
