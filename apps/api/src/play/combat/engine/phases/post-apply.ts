import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';
import { rollDice } from '../../../../utils/dice';

// POST_APPLY phase — fires concentration saves for any surviving non-AI target that was
// concentrating, then checks for reaction opportunities on single-target, non-chain hits.
// Reactions are suppressed for AoE actions; concentration saves fire for AoE too.
export async function runPostApply(ctx: CombatActionContext, { db, roller }: PipelineServices): Promise<void> {
    if (!ctx.isHit || !ctx.profile?.dealsDamage || !ctx.targetParticipant || ctx.actualTargetId === null) return;
    if (ctx.defeated || ctx.knockedDown) return;
    if (ctx.targetParticipant.isAiControlled) return;

    // ── Concentration save ────────────────────────────────────────────────────
    // Fires for single-target AND AoE hits. DC = max(10, half of total damage dealt).
    const concentratingOnEffectId = ctx.targetParticipant?.concentratingOnEffectId ?? null;
    const totalDamage = ctx.finalDamage + ctx.finalElementalDamage;
    if (concentratingOnEffectId !== null && totalDamage > 0) {
        const effect = await db.activeCombat_BehaviorEffect.findUnique({
            where:  { id: concentratingOnEffectId },
            select: { effectType: { select: { name: true } } },
        });
        const effectName = effect?.effectType.name ?? 'concentration';

        const conStat = ctx.target?.stats.constitution ?? 10;
        const conMod  = Math.floor((conStat - 10) / 2);
        const roll    = rollDice(1, 20, roller)[0]!;
        const dc      = Math.max(10, Math.floor(totalDamage / 2));
        const total   = roll + conMod;
        const saved   = total >= dc;

        if (!saved) {
            // Deleting the effect cascades: concentratingOnEffectId on the participant is nulled via FK.
            await db.activeCombat_BehaviorEffect.delete({ where: { id: concentratingOnEffectId } }).catch(() => null);
        }

        ctx.concentrationSaveEvent = { entityName: ctx.target!.name, roll, total, dc, saved, effectName };
    }

    // ── Reaction check ───────────────────────────────────────────────────────
    // Suppressed for AoE actions and reaction chains.
    if (ctx.targetParticipant.hasUsedReaction) return;
    if (ctx.input.aoeIndex !== null) return;  // reactions are suppressed for AoE actions
    if (ctx.input.isReaction) return;         // no reaction chains

    const storageId = ctx.targetStorageId;
    if (storageId === null) return;

    const cooldowns = await db.activeCombat_Participant_ActionCooldown.findMany({
        where:  { participantId: ctx.targetParticipant.id },
        select: { equipmentProfileId: true },
    });

    const cooldownIds = new Set(cooldowns.map(c => c.equipmentProfileId));
    const isSpar      = ctx.combatMeta?.isSpar ?? false;

    const equipped = await db.storedItem.findMany({
        where: {
            storageId,
            isEquipped:    true,
            chosenProfile: {
                isReactionAction: true,
                usageContext:     { not: 'out_of_combat_only' },
                ...(isSpar ? { allowedInSpar: true } : {}),
            },
        },
        select: {
            id:            true,
            chosenProfile: { select: { id: true, label: true } },
        },
    });

    const reactionProfiles = equipped
        .filter(s => s.chosenProfile && !cooldownIds.has(s.chosenProfile.id))
        .map(s => ({ profileId: s.chosenProfile!.id, storedItemId: s.id, label: s.chosenProfile!.label ?? 'Reaction' }));

    if (reactionProfiles.length > 0) {
        ctx.pendingReaction = {
            defenderEntityId:   ctx.actualTargetId,
            defenderEntityName: ctx.target!.name,
            defenderUserId:     ctx.target!.userId,
            attackerEntityId:   ctx.input.actorEntityId,
            reactionProfiles,
        };
    }
}
