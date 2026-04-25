import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Loads actor, profile, and combat meta from DB. All reads for the actor side happen here.
export async function runDeclare(ctx: CombatActionContext, { db }: PipelineServices): Promise<void> {
    const [profileRow, combatRow, actorRow, existingCount] = await Promise.all([
        db.itemEquipmentProfile.findUnique({
            where:  { id: ctx.input.profileId },
            select: {
                label:            true,
                actionCategoryId: true,
                cooldownRounds:   true,
                hitBonus:         true,
                damageBonus:      true,
                healBonus:        true,
                damageDiceCount:  true,
                damageDiceSides:  true,
                healDiceCount:    true,
                healDiceSides:    true,
                hitStat:    { select: { name: true } },
                damageStat: { select: { name: true } },
                healStat:   { select: { name: true } },
                actionType: { select: { dealsDamage: true, restoresHealth: true } },
            },
        }),
        db.activeCombat.findUnique({
            where:  { id: ctx.input.combatId },
            select: { initiationType: { select: { canSecondWind: true } } },
        }),
        db.entity.findUnique({
            where:  { id: ctx.input.actorEntityId },
            select: {
                name:  true,
                stats: {
                    select: {
                        strength:     true,
                        dexterity:    true,
                        constitution: true,
                        intelligence: true,
                        wisdom:       true,
                        charisma:     true,
                    },
                },
            },
        }),
        db.activeCombat_Action.count({
            where: { activeCombatId: ctx.input.combatId, roundNumber: ctx.input.roundNumber },
        }),
    ]);

    if (profileRow) {
        ctx.profile = {
            label:            profileRow.label,
            actionCategoryId: profileRow.actionCategoryId,
            cooldownRounds:   profileRow.cooldownRounds,
            hitBonus:         profileRow.hitBonus,
            damageBonus:      profileRow.damageBonus,
            healBonus:        profileRow.healBonus,
            damageDiceCount:  profileRow.damageDiceCount,
            damageDiceSides:  profileRow.damageDiceSides,
            healDiceCount:    profileRow.healDiceCount,
            healDiceSides:    profileRow.healDiceSides,
            dealsDamage:      profileRow.actionType?.dealsDamage    ?? false,
            restoresHealth:   profileRow.actionType?.restoresHealth ?? false,
            hitStatName:      profileRow.hitStat?.name    ?? null,
            damageStatName:   profileRow.damageStat?.name ?? null,
            healStatName:     profileRow.healStat?.name   ?? null,
        };
    }

    if (combatRow) {
        ctx.combatMeta = { canSecondWind: combatRow.initiationType.canSecondWind };
    }

    if (actorRow) {
        ctx.actor = {
            name:  actorRow.name,
            stats: {
                strength:     actorRow.stats?.strength     ?? 10,
                dexterity:    actorRow.stats?.dexterity    ?? 10,
                constitution: actorRow.stats?.constitution ?? 10,
                intelligence: actorRow.stats?.intelligence ?? 10,
                wisdom:       actorRow.stats?.wisdom       ?? 10,
                charisma:     actorRow.stats?.charisma     ?? 10,
            },
        };
    }

    ctx.existingActionCount = existingCount;
}
