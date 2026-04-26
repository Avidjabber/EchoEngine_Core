-- Add saving throw fields to ItemEquipmentProfile.
-- When savingThrowStatId is set, a hit triggers a defender roll (d20 + stat mod) vs. saveDC.
-- On a successful save the damage is halved (primary and elemental).

ALTER TABLE "ItemEquipmentProfile" ADD COLUMN "savingThrowStatId" INTEGER;
ALTER TABLE "ItemEquipmentProfile" ADD COLUMN "saveDC" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "ItemEquipmentProfile_savingThrowStatId_idx" ON "ItemEquipmentProfile"("savingThrowStatId");

ALTER TABLE "ItemEquipmentProfile" ADD CONSTRAINT "ItemEquipmentProfile_savingThrowStatId_fkey"
    FOREIGN KEY ("savingThrowStatId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add saving throw result columns to ActiveCombat_Action.
-- saveRoll is the defender's raw d20; null when no save was triggered.
-- savedSuccessfully is true when the save succeeded (damage halved); null when no save triggered.

ALTER TABLE "ActiveCombat_Action" ADD COLUMN "saveRoll" INTEGER;
ALTER TABLE "ActiveCombat_Action" ADD COLUMN "savedSuccessfully" BOOLEAN;
