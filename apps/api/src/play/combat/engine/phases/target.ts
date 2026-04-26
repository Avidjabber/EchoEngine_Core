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
                stats:   { select: { dexterity: true, currentHp: true, maxHp: true } },
            },
        }),
        db.activeCombat_Participant.findFirst({
            where:  { activeCombatId: ctx.input.combatId, entityId: ctx.actualTargetId },
            select: { id: true, inSecondWind: true, isAiControlled: true },
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

    const dexMod = Math.floor(((targetRow.stats.dexterity ?? 10) - 10) / 2);
    ctx.targetAC = (targetRow.species?.baseAc ?? 10) + dexMod + equippedAcBonus;

    ctx.target = {
        name:      targetRow.name,
        userId:    targetRow.userId ?? null,
        currentHp: targetRow.stats.currentHp ?? 0,
        maxHp:     targetRow.stats.maxHp     ?? 0,
        baseAc:    targetRow.species?.baseAc  ?? 10,
        dexterity: targetRow.stats.dexterity  ?? 10,
    };

    if (participantRow) {
        ctx.targetParticipant = {
            id:             participantRow.id,
            inSecondWind:   participantRow.inSecondWind,
            isAiControlled: participantRow.isAiControlled,
        };
    }
}
