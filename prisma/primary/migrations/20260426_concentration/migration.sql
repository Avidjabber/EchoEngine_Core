-- Add isConcentration flag to CombatEffectType
ALTER TABLE "CombatEffectType" ADD COLUMN "isConcentration" BOOLEAN NOT NULL DEFAULT false;

-- Add concentratingOnEffectId to ActiveCombat_Participant
ALTER TABLE "ActiveCombat_Participant" ADD COLUMN "concentratingOnEffectId" INTEGER;
ALTER TABLE "ActiveCombat_Participant" ADD CONSTRAINT "ActiveCombat_Participant_concentratingOnEffectId_fkey"
    FOREIGN KEY ("concentratingOnEffectId") REFERENCES "ActiveCombat_BehaviorEffect"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "ActiveCombat_Participant_concentratingOnEffectId_key" ON "ActiveCombat_Participant"("concentratingOnEffectId");
