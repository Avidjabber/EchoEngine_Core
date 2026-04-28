import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// APPLY phase, priority 2 — clears all active stat effects and behavior effects
// from the target when the action profile's behavior effect type has removesEffects.
// Runs after guard absorption (0) and damage modifiers (1) so the hit is fully
// resolved before dispel state is written.
export const dispelInterceptor: CombatInterceptor = {
    phase:    'APPLY',
    priority: 2,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.profile?.behaviorEffectRemovesEffects) return;
        if (ctx.profile.dealsDamage && !ctx.isHit) return;
        if (!ctx.profile.dealsDamage && ctx.savedSuccessfully) return;
        if (ctx.targetParticipant === null) return;

        const targetId = ctx.targetParticipant.id;
        await db.$transaction([
            db.activeCombat_StatEffect.deleteMany({
                where: { affectedParticipantId: targetId },
            }),
            db.activeCombat_BehaviorEffect.deleteMany({
                where: { affectedParticipantId: targetId },
            }),
        ]);
    },
};
