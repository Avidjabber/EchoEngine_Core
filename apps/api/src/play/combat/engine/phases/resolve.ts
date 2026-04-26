import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';
import type { DiceRoller } from '../../../../utils/dice';
import { rollDice } from '../../../../utils/dice';

function rollWithAdvantage(sides: number, adv: 'advantage' | 'disadvantage' | null, roller: DiceRoller): number {
    if (adv === null) return rollDice(1, sides, roller)[0]!;
    const [a, b] = rollDice(2, sides, roller) as [number, number];
    return adv === 'advantage' ? Math.max(a, b) : Math.min(a, b);
}

function rollDiceWithAdvantage(count: number, sides: number, adv: 'advantage' | 'disadvantage' | null, roller: DiceRoller): number[] {
    if (adv === null) return rollDice(count, sides, roller);
    const roll1 = rollDice(count, sides, roller);
    const roll2 = rollDice(count, sides, roller);
    const sum1  = roll1.reduce((a, b) => a + b, 0);
    const sum2  = roll2.reduce((a, b) => a + b, 0);
    return adv === 'advantage'
        ? (sum1 >= sum2 ? roll1 : roll2)
        : (sum1 <= sum2 ? roll1 : roll2);
}

// Pure computation — executes dice rolls.
export async function runResolve(ctx: CombatActionContext, { roller }: PipelineServices): Promise<void> {
    const { profile, target } = ctx;
    if (!profile || !target) return;

    if (profile.dealsDamage) {
        const raw      = rollWithAdvantage(20, ctx.hitAdvantage, roller);
        ctx.hitRoll    = raw;
        ctx.hitTotal   = raw + ctx.hitModifier;
        ctx.isCritical = raw === 20;
        ctx.isFumble   = raw === 1;
        // Nat 20 always hits; nat 1 always misses; otherwise compare total to AC.
        ctx.isHit = ctx.isCritical || (!ctx.isFumble && ctx.hitTotal >= ctx.targetAC);

        if (ctx.isHit && profile.damageDiceCount && profile.damageDiceSides) {
            const diceCount   = ctx.isCritical ? profile.damageDiceCount * 2 : profile.damageDiceCount;
            ctx.diceRolls     = rollDiceWithAdvantage(diceCount, profile.damageDiceSides, ctx.damageAdvantage, roller);
            ctx.rawDamage     = ctx.diceRolls.reduce((a, b) => a + b, 0);
            ctx.finalDamage   = Math.max(0, ctx.rawDamage + ctx.damageModifier);
        }

        if (ctx.isHit && profile.elementalDiceCount && profile.elementalDiceSides) {
            const diceCount          = ctx.isCritical ? profile.elementalDiceCount * 2 : profile.elementalDiceCount;
            ctx.elementalDiceRolls   = rollDice(diceCount, profile.elementalDiceSides, roller);
            ctx.rawElementalDamage   = ctx.elementalDiceRolls.reduce((a, b) => a + b, 0);
            // Resistance interceptors scale finalElementalDamage in APPLY.
            ctx.finalElementalDamage = ctx.rawElementalDamage;
        }

        // Saving throw fires on a hit for damage actions, or always for non-damage actions
        // (e.g. a stun has no hit roll — ctx.isHit stays null — but still needs a save).
        if ((ctx.isHit || !profile.dealsDamage) && profile.savingThrowStatName && profile.saveDC > 0) {
            const statValue = target.stats[profile.savingThrowStatName] ?? 10;
            const statMod   = Math.floor((statValue - 10) / 2);
            const saveD20   = rollDice(1, 20, roller)[0]!;
            ctx.saveRoll          = saveD20;
            ctx.saveTotal         = saveD20 + statMod;
            ctx.savedSuccessfully = ctx.saveTotal >= profile.saveDC;
            if (ctx.savedSuccessfully) {
                ctx.finalDamage          = Math.floor(ctx.finalDamage / 2);
                ctx.finalElementalDamage = Math.floor(ctx.finalElementalDamage / 2);
            }
        }
    } else if (profile.restoresHealth) {
        if (profile.healDiceCount && profile.healDiceSides) {
            ctx.diceRolls = rollDiceWithAdvantage(profile.healDiceCount, profile.healDiceSides, ctx.healAdvantage, roller);
            ctx.rawHeal   = ctx.diceRolls.reduce((a, b) => a + b, 0);
        }
        ctx.finalHeal = Math.max(0, ctx.rawHeal + ctx.healModifier);
    }
}
