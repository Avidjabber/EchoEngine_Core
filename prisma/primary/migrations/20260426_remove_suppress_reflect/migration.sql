-- Remove suppress (no solid 5e basis; stun already covers reaction denial) and
-- reflect (no 5e equivalent) from CombatEffectType.
ALTER TABLE "CombatEffectType" DROP COLUMN "suppressesReactive";
ALTER TABLE "CombatEffectType" DROP COLUMN "reflectsDamage";

DELETE FROM "CombatEffectType" WHERE name IN ('suppress', 'reflect');
