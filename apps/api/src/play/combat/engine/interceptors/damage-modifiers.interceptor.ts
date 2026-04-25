import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

type DamageModifierRow = { damageTypeId: number; modifier: number; isImmune: boolean };
type EffectRow = { effectDef: { damageModifiers: DamageModifierRow[] } };

function applyModifiers(amount: number, damageTypeId: number, effects: EffectRow[]): number {
    for (const effect of effects) {
        for (const mod of effect.effectDef.damageModifiers) {
            if (mod.damageTypeId !== damageTypeId) continue;
            if (mod.isImmune) return 0;
            amount = Math.floor(amount * mod.modifier);
        }
    }
    return Math.max(0, amount);
}

// APPLY phase, priority 1 — scales finalDamage and finalElementalDamage based on the target's
// active resistance, vulnerability, and immunity stat effects.
// Runs after guard-absorption (priority 0) so resistances apply to the post-absorption amount.
// Untyped damage (null damageTypeId) bypasses all type-based modifiers.
export const damageModifiersInterceptor: CombatInterceptor = {
    phase:    'APPLY',
    priority: 1,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.isHit || !ctx.profile?.dealsDamage || !ctx.targetParticipant) return;
        if (ctx.finalDamage === 0 && ctx.finalElementalDamage === 0) return;

        const effects = await db.activeCombat_StatEffect.findMany({
            where:  { affectedParticipantId: ctx.targetParticipant.id },
            select: {
                effectDef: {
                    select: {
                        damageModifiers: { select: { damageTypeId: true, modifier: true, isImmune: true } },
                    },
                },
            },
        });

        if (ctx.profile.damageTypeId !== null && ctx.finalDamage > 0) {
            ctx.finalDamage = applyModifiers(ctx.finalDamage, ctx.profile.damageTypeId, effects);
        }

        if (ctx.profile.elementalDamageTypeId !== null && ctx.finalElementalDamage > 0) {
            ctx.finalElementalDamage = applyModifiers(ctx.finalElementalDamage, ctx.profile.elementalDamageTypeId, effects);
        }
    },
};
