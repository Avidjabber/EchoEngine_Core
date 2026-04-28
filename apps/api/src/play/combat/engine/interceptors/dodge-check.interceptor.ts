import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// TARGET phase, priority 1 — if the intended target has an active dodge behavior effect,
// apply disadvantage to the attacker's hit roll. Runs after guard redirect (priority 0)
// so the final target is already resolved before we check their effects.
export const dodgeCheckInterceptor: CombatInterceptor = {
    phase:    'TARGET',
    priority: 1,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.profile?.dealsDamage) return;
        if (ctx.actualTargetId === null) return;

        // ctx.targetParticipant is not yet populated — TARGET interceptors run before runTarget.
        // Use a relation filter on affectedParticipant to resolve entity → participant in one query.
        const dodge = await db.activeCombat_BehaviorEffect.findFirst({
            where: {
                affectedParticipant: { activeCombatId: ctx.input.combatId, entityId: ctx.actualTargetId },
                effectType:          { grantsHitDisadvantage: true },
            },
            select: { id: true },
        });

        if (!dodge) return;

        // Advantage and disadvantage cancel — if actor somehow already had advantage, nullify.
        ctx.hitAdvantage = ctx.hitAdvantage === 'advantage' ? null : 'disadvantage';

        // Dodging entity also has advantage on DEX saving throws.
        // 'dexterity' must match the ItemStat.name value and the key used in target.stats.
        const DEX_STAT = 'dexterity';
        if (ctx.profile?.savingThrowStatName?.toLowerCase() === DEX_STAT) {
            ctx.saveAdvantage = ctx.saveAdvantage === 'disadvantage' ? null : 'advantage';
        }
    },
};
