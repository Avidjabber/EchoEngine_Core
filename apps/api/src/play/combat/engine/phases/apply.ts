import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Commits HP changes to the database. Only DB-write phase for action resolution.
// Stage 2+ interceptors can modify ctx.finalDamage before this phase runs
// (e.g., resistance halves it, absorb buffers it).
export async function runApply(ctx: CombatActionContext, { db }: PipelineServices): Promise<void> {
    if (ctx.aborted || !ctx.isHit || !ctx.target || ctx.actualTargetId === null) return;
    if (!ctx.profile?.dealsDamage) return;

    const newHp = ctx.target.currentHp - ctx.finalDamage;
    await db.entityStats.update({
        where: { entityId: ctx.actualTargetId },
        data:  { currentHp: newHp },
    });

    ctx.hpAfter = Math.max(0, newHp);

    if (newHp <= 0 && ctx.targetParticipant) {
        const canSecondWind    = ctx.combatMeta?.canSecondWind ?? false;
        const { isAiControlled, inSecondWind } = ctx.targetParticipant;

        if (isAiControlled || !canSecondWind || inSecondWind) {
            await db.activeCombat_Participant.update({
                where: { id: ctx.targetParticipant.id },
                data:  { isDefeated: true },
            });
            ctx.defeated = true;
        } else {
            ctx.knockedDown = true;
        }
    }
}
