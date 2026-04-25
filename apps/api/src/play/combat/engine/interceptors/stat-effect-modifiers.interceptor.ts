import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

// PRE_RESOLVE phase — seeds roll modifiers and advantage flags from the actor's active stat effects.
// Runs before runPreResolve so that += in pre-resolve accumulates these on top.
export const statEffectModifiersInterceptor: CombatInterceptor = {
    phase:    'PRE_RESOLVE',
    priority: 0,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (ctx.actorParticipantId === null) return;

        const effects = await db.activeCombat_StatEffect.findMany({
            where:  { affectedParticipantId: ctx.actorParticipantId },
            select: {
                effectDef: {
                    select: {
                        rollMods:      { select: { value: true, rollType: { select: { name: true } } } },
                        rollAdvantages: { select: { isDisadvantage: true, rollType: { select: { name: true } } } },
                    },
                },
            },
        });

        let hitAdv = false,  hitDisadv = false;
        let dmgAdv = false,  dmgDisadv = false;
        let healAdv = false, healDisadv = false;

        for (const effect of effects) {
            for (const mod of effect.effectDef.rollMods) {
                if (mod.rollType.name === 'hit')    ctx.hitModifier    += mod.value;
                if (mod.rollType.name === 'damage') ctx.damageModifier += mod.value;
                if (mod.rollType.name === 'heal')   ctx.healModifier   += mod.value;
            }
            for (const adv of effect.effectDef.rollAdvantages) {
                const isDisadv = adv.isDisadvantage;
                if (adv.rollType.name === 'hit')    { if (isDisadv) hitDisadv  = true; else hitAdv  = true; }
                if (adv.rollType.name === 'damage') { if (isDisadv) dmgDisadv  = true; else dmgAdv  = true; }
                if (adv.rollType.name === 'heal')   { if (isDisadv) healDisadv = true; else healAdv = true; }
            }
        }

        // Advantage and disadvantage cancel each other out (D&D 5e rule).
        ctx.hitAdvantage    = hitAdv  === hitDisadv  ? null : hitAdv  ? 'advantage' : 'disadvantage';
        ctx.damageAdvantage = dmgAdv  === dmgDisadv  ? null : dmgAdv  ? 'advantage' : 'disadvantage';
        ctx.healAdvantage   = healAdv === healDisadv ? null : healAdv ? 'advantage' : 'disadvantage';
    },
};
