-- Counterattack is covered by the existing manual reaction system; remove the redundant flags.
ALTER TABLE "CombatEffectType" DROP COLUMN "enablesCounterattack";
ALTER TABLE "CombatEffectType" DROP COLUMN "hasReactAction";

-- Remove the counterattack seed row (seed uses skipDuplicates so this can't be undone by re-seeding).
DELETE FROM "CombatEffectType" WHERE name = 'counterattack';
