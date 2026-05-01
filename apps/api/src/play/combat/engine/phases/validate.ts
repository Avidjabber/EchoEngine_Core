import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Pure validation — no DB access. Sets ctx.aborted if the action cannot proceed.
export async function runValidate(ctx: CombatActionContext, _svc: PipelineServices): Promise<void> {
    if (!ctx.profile || !ctx.actor || !ctx.combatMeta || ctx.actorParticipantId === null) {
        ctx.aborted     = true;
        ctx.abortReason = 'Combat data could not be loaded.';
        return;
    }

    if (ctx.actorParticipant?.isUnconscious) {
        ctx.aborted     = true;
        ctx.abortReason = 'You are unconscious and cannot act.';
        return;
    }

    // Both flags must be true for this to be a genuine reaction; any other combination
    // requires turn-order and category enforcement.
    if (!(ctx.profile.isReactionAction && ctx.input.isReaction)) {
        if (ctx.profile.actionCategoryId === null) {
            ctx.aborted     = true;
            ctx.abortReason = 'Combat data could not be loaded.';
            return;
        }

        if (ctx.actorTurnOrder === null || ctx.actorTurnOrder !== ctx.combatMeta.currentTurnOrder) {
            ctx.aborted     = true;
            ctx.abortReason = 'It is not this entity\'s turn.';
            return;
        }
    }

    if (ctx.profile.dealsDamage && ctx.actualTargetId === null) {
        ctx.aborted     = true;
        ctx.abortReason = 'A target is required for damaging actions.';
        return;
    }

    if (ctx.profile.restoresHealth && ctx.actualTargetId === null) {
        ctx.aborted     = true;
        ctx.abortReason = 'A target is required for healing actions.';
        return;
    }

    // Non-guard behavior effects (stun, taunt, dispel) must target an enemy, not the actor.
    if (ctx.profile.behaviorEffectTypeId !== null && !ctx.profile.behaviorEffectRedirectsDamage && ctx.actualTargetId === null) {
        ctx.aborted     = true;
        ctx.abortReason = 'A target is required for this action.';
        return;
    }
}
