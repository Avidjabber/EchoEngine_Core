import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Loads target data from DB and calculates AC.
export async function runTarget(ctx: CombatActionContext, { db }: PipelineServices): Promise<void> {
    if (ctx.actualTargetId === null) return;

    const [targetRow, participantRow, entityStorageRow] = await Promise.all([
        db.entity.findUnique({
            where:  { id: ctx.actualTargetId },
            select: {
                name:    true,
                userId:  true,
                species: { select: { baseAc: true } },
                stats:   { select: { strength: true, dexterity: true, constitution: true, intelligence: true, wisdom: true, charisma: true, currentHp: true, maxHp: true } },
            },
        }),
        db.activeCombat_Participant.findFirst({
            where:  { activeCombatId: ctx.input.combatId, entityId: ctx.actualTargetId },
            select: { id: true, isUnconscious: true, isAiControlled: true, hasUsedReaction: true, tempHp: true, legendaryResistancesRemaining: true, concentratingOnEffectId: true },
        }),
        db.entity_Storage.findUnique({
            where:  { entityId: ctx.actualTargetId },
            select: { storageId: true },
        }),
    ]);

    if (!targetRow?.stats) return;

    let equippedAcBonus = 0;
    if (entityStorageRow) {
        const equipped = await db.storedItem.findMany({
            where:  { storageId: entityStorageRow.storageId, isEquipped: true },
            select: { chosenProfile: { select: { acModifier: true } } },
        });
        equippedAcBonus = equipped.reduce((sum, i) => sum + (i.chosenProfile?.acModifier ?? 0), 0);
    }

    const dex    = targetRow.stats.dexterity ?? 10;
    const dexMod = Math.floor((dex - 10) / 2);
    ctx.targetAC        = (targetRow.species?.baseAc ?? 10) + dexMod + equippedAcBonus;
    ctx.targetStorageId = entityStorageRow?.storageId ?? null;

    ctx.target = {
        name:      targetRow.name,
        userId:    targetRow.userId ?? null,
        currentHp: targetRow.stats.currentHp ?? 0,
        maxHp:     targetRow.stats.maxHp     ?? 0,
        baseAc:    targetRow.species?.baseAc  ?? 10,
        stats: {
            strength:     targetRow.stats.strength     ?? 10,
            dexterity:    dex,
            constitution: targetRow.stats.constitution ?? 10,
            intelligence: targetRow.stats.intelligence ?? 10,
            wisdom:       targetRow.stats.wisdom       ?? 10,
            charisma:     targetRow.stats.charisma     ?? 10,
        },
    };

    if (participantRow) {
        ctx.targetParticipant = {
            id:              participantRow.id,
            isUnconscious:    participantRow.isUnconscious,
            isAiControlled:  participantRow.isAiControlled,
            hasUsedReaction: participantRow.hasUsedReaction,
            tempHp:                        participantRow.tempHp,
            legendaryResistancesRemaining: participantRow.legendaryResistancesRemaining,
            concentratingOnEffectId:       participantRow.concentratingOnEffectId ?? null,
        };

        if (participantRow.isUnconscious && ctx.profile?.dealsDamage) {
            ctx.aborted     = true;
            ctx.abortReason = 'You cannot target an unconscious entity with a damaging action.';
            return;
        }
    }
}
