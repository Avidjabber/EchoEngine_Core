-- Rename secondWindTriggered -> knockedDown on ActiveCombat_Action
ALTER TABLE "ActiveCombat_Action" RENAME COLUMN "secondWindTriggered" TO "knockedDown";

-- Add legendaryResistancesMax to Species (null = not legendary; N = charges per combat)
ALTER TABLE "Species" ADD COLUMN "legendaryResistancesMax" INTEGER;
