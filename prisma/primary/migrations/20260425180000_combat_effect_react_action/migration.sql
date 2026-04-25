ALTER TABLE "CombatEffectType" ADD COLUMN "hasReactAction" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ItemEquipmentProfile" ADD COLUMN "isReactionAction" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "ItemEquipmentProfile_isReactionAction_idx" ON "ItemEquipmentProfile"("isReactionAction") WHERE "isReactionAction" = true;

ALTER TABLE "ActiveCombat_Action" ALTER COLUMN "actionCategoryId" DROP NOT NULL;
