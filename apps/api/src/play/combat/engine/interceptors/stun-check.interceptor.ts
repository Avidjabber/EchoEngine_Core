import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// VALIDATE phase — aborts the action if the actor has a deniesActions behavior effect active.
// Applies to all actions including reactions (stunned entities cannot react in D&D 5e).
export const stunCheckInterceptor: CombatInterceptor = {
    phase:    'VALIDATE',
    priority: 0,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (ctx.actorParticipantId === null) return;

        const stun = await db.activeCombat_BehaviorEffect.findFirst({
            where: {
                affectedParticipantId: ctx.actorParticipantId,
                effectType:            { deniesActions: true },
            },
            select: { id: true },
        });

        if (stun) {
            ctx.aborted     = true;
            ctx.abortReason = 'You are stunned and cannot act.';
        }
    },
};
