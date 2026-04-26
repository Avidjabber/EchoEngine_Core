-- Add Help roll modifier to participant — set by the Help action, consumed on next attack roll
ALTER TABLE "ActiveCombat_Participant" ADD COLUMN "helpRollMod" VARCHAR(20);

-- Allow action log entries without an equipment profile (for builtin actions: Dodge, Help)
ALTER TABLE "ActiveCombat_Action" ALTER COLUMN "equipmentProfileId" DROP NOT NULL;
