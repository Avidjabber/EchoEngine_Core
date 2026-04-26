import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// POST_APPLY phase — after a successful hit, checks whether the defender has
// equipped reaction actions and populates ctx.pendingReaction if so.
// Skipped for AI-controlled defenders and when the defender is under a suppress effect.
export async function runPostApply(ctx: CombatActionContext, { db }: PipelineServices): Promise<void> {
    if (!ctx.isHit || !ctx.profile?.dealsDamage || !ctx.targetParticipant || ctx.actualTargetId === null) return;
    if (ctx.defeated || ctx.knockedDown) return;
    if (ctx.targetParticipant.isAiControlled) return;
    if (ctx.targetParticipant.hasUsedReaction) return;
    if (ctx.input.aoeIndex !== null) return;  // reactions are suppressed for AoE actions
    if (ctx.input.isReaction) return;         // no reaction chains

    const suppressed = await db.activeCombat_BehaviorEffect.findFirst({
        where: {
            affectedParticipantId: ctx.targetParticipant.id,
            effectType:            { suppressesReactive: true },
        },
        select: { id: true },
    });
    if (suppressed) return;

    const storageId = ctx.targetStorageId;
    if (storageId === null) return;

    const cooldowns = await db.activeCombat_Participant_ActionCooldown.findMany({
        where:  { participantId: ctx.targetParticipant.id },
        select: { equipmentProfileId: true },
    });

    const cooldownIds = new Set(cooldowns.map(c => c.equipmentProfileId));
    const isSpar      = ctx.combatMeta?.isSpar ?? false;

    const equipped = await db.storedItem.findMany({
        where: {
            storageId,
            isEquipped:    true,
            chosenProfile: {
                isReactionAction: true,
                usageContext:     { not: 'out_of_combat_only' },
                ...(isSpar ? { allowedInSpar: true } : {}),
            },
        },
        select: {
            id:            true,
            chosenProfile: { select: { id: true, label: true } },
        },
    });

    const reactionProfiles = equipped
        .filter(s => s.chosenProfile && !cooldownIds.has(s.chosenProfile.id))
        .map(s => ({ profileId: s.chosenProfile!.id, storedItemId: s.id, label: s.chosenProfile!.label ?? 'Reaction' }));

    if (reactionProfiles.length === 0) return;

    ctx.pendingReaction = {
        defenderEntityId:   ctx.actualTargetId,
        defenderEntityName: ctx.target!.name,
        defenderUserId:     ctx.target!.userId,
        attackerEntityId:   ctx.input.actorEntityId,
        reactionProfiles,
    };
}
