import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';
import { rollDice } from '../../../../utils/dice';

// Pure computation — executes dice rolls.
// Stage 1: hit-roll attacks only.
// Stage 2+ will add healing rolls and saving throws here.
export async function runResolve(ctx: CombatActionContext, { roller }: PipelineServices): Promise<void> {
    const { profile, target } = ctx;
    if (!profile || !target) return;

    if (profile.dealsDamage) {
        const [raw] = rollDice(1, 20, roller);
        ctx.hitRoll    = raw!;
        ctx.hitTotal   = raw! + ctx.hitModifier;
        ctx.isCritical = raw === 20;
        ctx.isFumble   = raw === 1;
        // Nat 20 always hits; nat 1 always misses; otherwise compare total to AC.
        ctx.isHit = ctx.isCritical || (!ctx.isFumble && ctx.hitTotal >= ctx.targetAC);

        if (ctx.isHit && profile.damageDiceCount && profile.damageDiceSides) {
            const diceCount   = ctx.isCritical ? profile.damageDiceCount * 2 : profile.damageDiceCount;
            ctx.diceRolls     = rollDice(diceCount, profile.damageDiceSides, roller);
            ctx.rawDamage     = ctx.diceRolls.reduce((a, b) => a + b, 0);
            ctx.finalDamage   = Math.max(0, ctx.rawDamage + ctx.damageModifier);
        }

        if (ctx.isHit && profile.elementalDiceCount && profile.elementalDiceSides) {
            const diceCount          = ctx.isCritical ? profile.elementalDiceCount * 2 : profile.elementalDiceCount;
            ctx.elementalDiceRolls   = rollDice(diceCount, profile.elementalDiceSides, roller);
            ctx.rawElementalDamage   = ctx.elementalDiceRolls.reduce((a, b) => a + b, 0);
            // No modifier on elemental in stage 1. Stage 2 resistance interceptors scale finalElementalDamage.
            ctx.finalElementalDamage = ctx.rawElementalDamage;
        }
    }
}
