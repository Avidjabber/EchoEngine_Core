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
        if (ctx.targetParticipant === null) return;

        const dodge = await db.activeCombat_BehaviorEffect.findFirst({
            where: {
                affectedParticipantId: ctx.targetParticipant.id,
                effectType:            { grantsHitDisadvantage: true },
            },
            select: { id: true },
        });

        if (!dodge) return;

        // Advantage and disadvantage cancel — if actor somehow already had advantage, nullify.
        ctx.hitAdvantage = ctx.hitAdvantage === 'advantage' ? null : 'disadvantage';

        // Dodging entity also has advantage on DEX saving throws.
        if (ctx.profile?.savingThrowStatName?.toLowerCase() === 'dexterity') {
            ctx.saveAdvantage = ctx.saveAdvantage === 'disadvantage' ? null : 'advantage';
        }
    },
};
