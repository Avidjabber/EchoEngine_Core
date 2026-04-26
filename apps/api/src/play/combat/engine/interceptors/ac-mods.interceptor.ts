import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// PRE_RESOLVE phase — applies flat AC modifiers from the target's active stat effects.
// Runs after stat-effect-modifiers (priority 0) so both passes complete before RESOLVE rolls.
export const acModsInterceptor: CombatInterceptor = {
    phase:    'PRE_RESOLVE',
    priority: 1,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.targetParticipant) return;

        const effects = await db.activeCombat_StatEffect.findMany({
            where:  { affectedParticipantId: ctx.targetParticipant.id },
            select: { effectDef: { select: { acMods: { select: { value: true } } } } },
        });

        for (const effect of effects) {
            for (const mod of effect.effectDef.acMods) {
                ctx.targetAC += mod.value;
            }
        }
    },
};
