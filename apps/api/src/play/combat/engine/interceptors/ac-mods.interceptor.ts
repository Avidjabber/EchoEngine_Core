import type { CombatInterceptor } from '../combat-interceptor.interface';
import type { CombatActionContext } from '../combat-action-context';
import type { PrimaryDatabaseService } from '../../../../database/primary.service';

type DamageModifierRow = { damageTypeId: number; modifier: number; isImmune: boolean };
type EffectRow = { effectDef: { acMods: { value: number }[]; damageModifiers: DamageModifierRow[] } };

// D&D standard: immunity always wins; one application of resistance and one of vulnerability per
// damage type (best in each category); if both are present they cancel each other out.
function computeMultiplier(damageTypeId: number, effects: EffectRow[]): number {
    let hasImmunity    = false;
    let bestResistance = 1.0;
    let bestVuln       = 1.0;

    for (const effect of effects) {
        for (const mod of effect.effectDef.damageModifiers) {
            if (mod.damageTypeId !== damageTypeId) continue;
            if (mod.isImmune)       { hasImmunity = true; continue; }
            if (mod.modifier < 1.0) bestResistance = Math.min(bestResistance, mod.modifier);
            if (mod.modifier > 1.0) bestVuln       = Math.max(bestVuln, mod.modifier);
        }
    }

    if (hasImmunity) return 0;
    const hasResistance    = bestResistance < 1.0;
    const hasVulnerability = bestVuln       > 1.0;
    if (hasResistance && hasVulnerability) return 1.0;
    if (hasResistance)                     return bestResistance;
    if (hasVulnerability)                  return bestVuln;
    return 1.0;
}

// PRE_RESOLVE phase, priority 1 — applies flat AC modifiers from the target's active stat effects,
// and pre-computes damage resistance/vulnerability/immunity multipliers for the APPLY phase.
// Fetching both in one query eliminates a second stat-effects round-trip in damageModifiersInterceptor.
// Runs after stat-effect-modifiers (priority 0) so both passes complete before RESOLVE rolls.
export const acModsInterceptor: CombatInterceptor = {
    phase:    'PRE_RESOLVE',
    priority: 1,

    async apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void> {
        if (!ctx.targetParticipant) return;

        const effects = await db.activeCombat_StatEffect.findMany({
            where:  { affectedParticipantId: ctx.targetParticipant.id },
            select: {
                effectDef: {
                    select: {
                        acMods:          { select: { value: true } },
                        damageModifiers: { select: { damageTypeId: true, modifier: true, isImmune: true } },
                    },
                },
            },
        });

        for (const effect of effects) {
            for (const mod of effect.effectDef.acMods) {
                ctx.targetAC += mod.value;
            }
        }

        // Pre-compute damage multipliers for the APPLY phase (avoids a second stat-effects query).
        if (ctx.profile !== null && ctx.profile.damageTypeId !== null) {
            ctx.primaryDamageMultiplier = computeMultiplier(ctx.profile.damageTypeId, effects);
        }
        if (ctx.profile !== null && ctx.profile.elementalDamageTypeId !== null) {
            ctx.elementalDamageMultiplier = computeMultiplier(ctx.profile.elementalDamageTypeId, effects);
        }
    },
};
