-- Add grantsHitDisadvantage to CombatEffectType (dodge behavior effect flag)
ALTER TABLE "CombatEffectType" ADD COLUMN "grantsHitDisadvantage" BOOLEAN NOT NULL DEFAULT false;

-- Add legendaryResistancesRemaining to ActiveCombat_Participant
-- NULL = not a legendary creature; positive value = charges remaining
ALTER TABLE "ActiveCombat_Participant" ADD COLUMN "legendaryResistancesRemaining" INTEGER;

-- Seed the new dodge effect type
INSERT INTO "CombatEffectType" (name, "modifiesRoll", "modifiesStat", "deniesActions", "modifiesAC", "redirectsDamage", "forcesTargeting", "removesEffects", "grantsHitDisadvantage")
VALUES ('dodge', false, false, false, false, false, false, false, true)
ON CONFLICT (name) DO NOTHING;
