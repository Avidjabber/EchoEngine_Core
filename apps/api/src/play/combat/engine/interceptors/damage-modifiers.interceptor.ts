import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// APPLY phase, priority 1 — scales finalDamage and finalElementalDamage by the target's
// precomputed resistance/vulnerability/immunity multipliers. Multipliers are set in PRE_RESOLVE
// by acModsInterceptor (same stat-effects query) to avoid a second DB round-trip here.
// Runs after guard-absorption (priority 0) so resistances apply to the post-absorption amount.
// Untyped damage (null damageTypeId) bypasses all type-based modifiers.
export const damageModifiersInterceptor: CombatInterceptor = {
    phase:    'APPLY',
    priority: 1,

    async apply(ctx: CombatActionContext, _db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.isHit || !ctx.profile?.dealsDamage || !ctx.targetParticipant) return;
        if (ctx.finalDamage === 0 && ctx.finalElementalDamage === 0) return;

        if (ctx.profile.damageTypeId !== null && ctx.finalDamage > 0) {
            ctx.finalDamage = Math.max(0, Math.floor(ctx.finalDamage * ctx.primaryDamageMultiplier));
        }
        if (ctx.profile.elementalDamageTypeId !== null && ctx.finalElementalDamage > 0) {
            ctx.finalElementalDamage = Math.floor(ctx.finalElementalDamage * ctx.elementalDamageMultiplier);
        }
    },
};
