ALTER TABLE "ActiveCombat_BehaviorEffect" ADD COLUMN "sourceParticipantId" INTEGER;

ALTER TABLE "ActiveCombat_BehaviorEffect"
    ADD CONSTRAINT "ActiveCombat_BehaviorEffect_sourceParticipantId_fkey"
    FOREIGN KEY ("sourceParticipantId")
    REFERENCES "ActiveCombat_Participant"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

CREATE INDEX "ActiveCombat_BehaviorEffect_sourceParticipantId_idx"
    ON "ActiveCombat_BehaviorEffect"("sourceParticipantId");
