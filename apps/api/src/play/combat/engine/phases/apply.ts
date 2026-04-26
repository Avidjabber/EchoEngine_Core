import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Commits HP changes to the database. Only DB-write phase for action resolution.
// Stage 2+ interceptors can modify ctx.finalDamage before this phase runs
// (e.g., resistance halves it, absorb buffers it).
export async function runApply(ctx: CombatActionContext, { db }: PipelineServices): Promise<void> {
    if (ctx.aborted || !ctx.profile || !ctx.target || ctx.actualTargetId === null) return;

    if (ctx.profile.dealsDamage && ctx.isHit) {
        const newHp     = ctx.target.currentHp - ctx.finalDamage - ctx.finalElementalDamage;
        const clampedHp = Math.max(0, newHp);

        const canSecondWind   = ctx.combatMeta?.canSecondWind ?? false;
        const participant     = ctx.targetParticipant;
        const shouldDefeat    = newHp <= 0 && participant !== null
            && (participant.isAiControlled || !canSecondWind || participant.inSecondWind);
        const shouldKnockDown = newHp <= 0 && participant !== null && !shouldDefeat;

        await db.$transaction(async tx => {
            await tx.entityStats.update({
                where: { entityId: ctx.actualTargetId! },
                data:  { currentHp: clampedHp },
            });
            if (shouldDefeat) {
                await tx.activeCombat_Participant.update({
                    where: { id: participant!.id },
                    data:  { isDefeated: true },
                });
                await tx.activeCombat_BehaviorEffect.deleteMany({
                    where: { sourceParticipantId: participant!.id },
                });
            }
        });

        ctx.hpAfter     = clampedHp;
        ctx.defeated    = shouldDefeat;
        ctx.knockedDown = shouldKnockDown;
    } else if (ctx.profile.restoresHealth && ctx.finalHeal > 0) {
        const actualHeal = Math.min(ctx.finalHeal, ctx.target.maxHp - ctx.target.currentHp);
        ctx.finalHeal = actualHeal;
        ctx.hpAfter   = ctx.target.currentHp + actualHeal;

        if (actualHeal > 0) {
            await db.entityStats.update({
                where: { entityId: ctx.actualTargetId },
                data:  { currentHp: ctx.hpAfter },
            });
        }
    }
}
