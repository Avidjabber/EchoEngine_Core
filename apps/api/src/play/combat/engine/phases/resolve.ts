import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';
import { rollDice } from '../dice';

// Pure computation — executes dice rolls.
// Stage 1: hit-roll attacks only.
// Stage 2+ will add healing rolls and saving throws here.
export async function runResolve(ctx: CombatActionContext, { roller }: PipelineServices): Promise<void> {
    const { profile, target } = ctx;
    if (!profile || !target) return;

    if (profile.dealsDamage) {
        const [raw] = rollDice(1, 20, roller);
        ctx.hitRoll  = raw!;
        ctx.hitTotal = raw! + ctx.hitModifier;
        ctx.isHit    = ctx.hitTotal >= ctx.targetAC;

        if (ctx.isHit && profile.damageDiceCount && profile.damageDiceSides) {
            ctx.diceRolls   = rollDice(profile.damageDiceCount, profile.damageDiceSides, roller);
            ctx.rawDamage   = ctx.diceRolls.reduce((a, b) => a + b, 0);
            ctx.finalDamage = Math.max(0, ctx.rawDamage + ctx.damageModifier);
        }
    }
}
