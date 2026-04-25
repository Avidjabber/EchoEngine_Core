import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Pure computation — calculates hit, damage, and heal modifiers from actor stats.
// Stage 2+ interceptors will modify these values (e.g., flat roll mods from stat effects).
export async function runPreResolve(ctx: CombatActionContext, _svc: PipelineServices): Promise<void> {
    const { profile, actor } = ctx;
    if (!profile || !actor) return;

    const statMod = (v: number) => Math.floor((v - 10) / 2);
    const getStat = (name: string | null): number =>
        name ? (actor.stats[name] ?? 10) : 10;

    ctx.hitModifier    += statMod(getStat(profile.hitStatName))    + profile.hitBonus;
    ctx.damageModifier += statMod(getStat(profile.damageStatName)) + profile.damageBonus;
    ctx.healModifier   += statMod(getStat(profile.healStatName))   + profile.healBonus;
}
