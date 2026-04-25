import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Pure validation — no DB access. Sets ctx.aborted if the action cannot proceed.
export async function runValidate(ctx: CombatActionContext, _svc: PipelineServices): Promise<void> {
    if (!ctx.profile || !ctx.actor || !ctx.combatMeta) {
        ctx.aborted     = true;
        ctx.abortReason = 'Combat data could not be loaded.';
        return;
    }

    // Reactions fire out-of-turn and may have no action category — skip both checks.
    if (!ctx.profile.isReactionAction) {
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
}
