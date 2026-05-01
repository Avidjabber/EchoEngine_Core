import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// PRE_RESOLVE phase, priority -1 — if the actor received a Help advantage or
// disadvantage, apply it to their hit roll and mark it consumed so END clears it.
// Runs before stat-effect modifiers (priority 0) so Help stacks correctly with
// other advantage/disadvantage sources using the standard cancel rule.
export const helpCheckInterceptor: CombatInterceptor = {
    phase:    'PRE_RESOLVE',
    priority: -1,

    async apply(ctx: CombatActionContext, _db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.profile?.dealsDamage) return;
        const mod = ctx.actorParticipant?.helpRollMod;
        if (!mod) return;

        // Advantage and disadvantage cancel each other; same value reinforces (no change needed).
        if (ctx.hitAdvantage !== null && ctx.hitAdvantage !== mod) {
            ctx.hitAdvantage = null;
        } else {
            ctx.hitAdvantage = mod;
        }

        ctx.helpConsumed = true;
    },
};
