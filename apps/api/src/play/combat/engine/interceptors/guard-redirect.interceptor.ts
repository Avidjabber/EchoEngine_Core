import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// TARGET phase — redirects an incoming attack to the entity guarding the original target.
export const guardRedirectInterceptor: CombatInterceptor = {
    phase:    'TARGET',
    priority: 0,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.input.targetEntityId || !ctx.profile?.dealsDamage) return;

        const guard = await db.activeCombat_BehaviorEffect.findFirst({
            where: {
                activeCombatId:      ctx.input.combatId,
                effectType:          { redirectsDamage: true },
                linkedParticipant:   { entityId: ctx.input.targetEntityId },
                affectedParticipant: { isDefeated: false, hasFled: false },
            },
            orderBy: { id: 'asc' },
            select: {
                affectedParticipant: { select: { entityId: true } },
                linkedParticipant:   { select: { entity: { select: { name: true } } } },
            },
        });

        if (!guard) return;

        ctx.originalTargetName = guard.linkedParticipant?.entity.name ?? null;
        ctx.actualTargetId     = guard.affectedParticipant.entityId;
        ctx.wasRedirected      = true;
    },
};
