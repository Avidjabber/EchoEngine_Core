import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// APPLY phase, priority 0 — reduces finalDamage and finalElementalDamage by the
// guard's absorption fraction (percentModifier) before resistances/immunity run
// at priority 1. Only fires when an attack was redirected to a guarding entity.
export const guardAbsorptionInterceptor: CombatInterceptor = {
    phase:    'APPLY',
    priority: 0,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.wasRedirected || !ctx.isHit || !ctx.profile?.dealsDamage) return;
        if (ctx.finalDamage === 0 && ctx.finalElementalDamage === 0) return;
        if (ctx.actualTargetId === null) return;

        const guard = await db.activeCombat_BehaviorEffect.findFirst({
            where: {
                activeCombatId:      ctx.input.combatId,
                effectType:          { redirectsDamage: true },
                affectedParticipant: { entityId: ctx.actualTargetId },
            },
            select: { percentModifier: true },
        });

        if (!guard?.percentModifier) return;

        const pct = guard.percentModifier;
        const prevDamage   = ctx.finalDamage;
        const prevElemental = ctx.finalElementalDamage;

        if (ctx.finalDamage > 0) {
            ctx.finalDamage = Math.floor(ctx.finalDamage * pct);
        }
        if (ctx.finalElementalDamage > 0) {
            ctx.finalElementalDamage = Math.floor(ctx.finalElementalDamage * pct);
        }

        ctx.absorbedDamage = (prevDamage - ctx.finalDamage) + (prevElemental - ctx.finalElementalDamage);
    },
};
