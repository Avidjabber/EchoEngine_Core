-- Replace Second Wind choice mechanic with automatic death saving throws.
-- inSecondWind is repurposed: true = currently making death saves (at 0 HP).
-- Death saves are rolled automatically at the start of each knocked-down entity's turn.
ALTER TABLE "ActiveCombat_Participant" ADD COLUMN "deathSaveSuccesses" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ActiveCombat_Participant" ADD COLUMN "deathSaveFailures"  INTEGER NOT NULL DEFAULT 0;
