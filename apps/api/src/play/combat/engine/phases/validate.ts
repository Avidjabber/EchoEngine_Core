import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Pure validation — no DB access. Sets ctx.aborted if the action cannot proceed.
export async function runValidate(ctx: CombatActionContext, _svc: PipelineServices): Promise<void> {
    if (!ctx.profile || ctx.profile.actionCategoryId === null || !ctx.actor || !ctx.combatMeta) {
        ctx.aborted     = true;
        ctx.abortReason = 'Combat data could not be loaded.';
        return;
    }

    if (ctx.profile.dealsDamage && ctx.actualTargetId === null) {
        ctx.aborted     = true;
        ctx.abortReason = 'A target is required for damaging actions.';
        return;
    }
}
