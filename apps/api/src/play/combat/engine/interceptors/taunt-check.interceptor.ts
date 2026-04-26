import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// VALIDATE phase — enforces taunt (forcesTargeting) behavior effects.
// If the actor is taunted and using a damaging action, they must target the taunter.
// Reactions and non-damaging actions bypass this check.
export const tauntCheckInterceptor: CombatInterceptor = {
    phase:    'VALIDATE',
    priority: 1,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (ctx.actorParticipantId === null) return;
        if (!ctx.profile?.dealsDamage) return;
        if (ctx.input.isReaction) return;

        const taunt = await db.activeCombat_BehaviorEffect.findFirst({
            where: {
                affectedParticipantId: ctx.actorParticipantId,
                effectType:            { forcesTargeting: true },
                linkedParticipant:     { isDefeated: false, hasFled: false },
            },
            select: {
                linkedParticipant: { select: { entityId: true } },
            },
        });

        if (!taunt) return;

        // AoE actions cannot be used while taunted regardless of which target is currently
        // being processed — a taunted actor must use a single-target action against the taunter.
        if (ctx.input.aoeIndex !== null) {
            ctx.aborted     = true;
            ctx.abortReason = 'You are taunted and must target the taunting entity.';
            return;
        }

        const forcedTargetEntityId = taunt.linkedParticipant?.entityId ?? null;
        if (forcedTargetEntityId !== null && ctx.input.targetEntityId !== forcedTargetEntityId) {
            ctx.aborted     = true;
            ctx.abortReason = 'You are taunted and must target the taunting entity.';
        }
    },
};
