-- Remove behavior effect flags that have no D&D 5e equivalent or are superseded by
-- other planned mechanics (absorb → tempHp, dodge_stance → Dodge Action, untargetable,
-- parry → manual reaction system).
ALTER TABLE "CombatEffectType" DROP COLUMN "isReactive";
ALTER TABLE "CombatEffectType" DROP COLUMN "absorbsDamage";
ALTER TABLE "CombatEffectType" DROP COLUMN "grantsEvasion";
ALTER TABLE "CombatEffectType" DROP COLUMN "preventedAsTarget";

-- Remove the corresponding seed rows.
DELETE FROM "CombatEffectType" WHERE name IN ('parry', 'absorb', 'dodge_stance', 'untargetable');
