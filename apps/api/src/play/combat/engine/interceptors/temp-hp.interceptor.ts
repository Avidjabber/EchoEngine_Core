import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// APPLY phase, priority -1 — drains the target's temp HP buffer before real HP
// is touched by the apply phase. Runs before guard absorption (priority 0) because
// temp HP is the defender's own layer, not a redirect.
export const tempHpInterceptor: CombatInterceptor = {
    phase:    'APPLY',
    priority: -1,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.isHit || !ctx.profile?.dealsDamage) return;
        if (!ctx.targetParticipant || ctx.targetParticipant.tempHp <= 0) return;
        if (ctx.finalDamage === 0 && ctx.finalElementalDamage === 0) return;

        const totalIncoming = ctx.finalDamage + ctx.finalElementalDamage;
        const drained       = Math.min(ctx.targetParticipant.tempHp, totalIncoming);

        // Drain temp HP proportionally across primary and elemental damage pools.
        if (drained > 0) {
            const primaryShare   = ctx.finalDamage > 0
                ? Math.min(ctx.finalDamage, Math.ceil(drained * ctx.finalDamage / totalIncoming))
                : 0;
            const elementalShare = Math.min(ctx.finalElementalDamage, drained - primaryShare);

            ctx.finalDamage          = Math.max(0, ctx.finalDamage          - primaryShare);
            ctx.finalElementalDamage = Math.max(0, ctx.finalElementalDamage - elementalShare);
            ctx.tempHpDrained        = primaryShare + elementalShare;

            await db.activeCombat_Participant.update({
                where: { id: ctx.targetParticipant.id },
                data:  { tempHp: { decrement: ctx.tempHpDrained } },
            });
        }
    },
};
