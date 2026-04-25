-- Add behavior effect magnitude fields to ItemEquipmentProfile.
-- These are copied to ActiveCombat_BehaviorEffect at application time so
-- intercept code (guard redirect, etc.) can read magnitude without joining back to the source.

ALTER TABLE "ItemEquipmentProfile" ADD COLUMN "flatModifier" INTEGER;
ALTER TABLE "ItemEquipmentProfile" ADD COLUMN "percentModifier" DOUBLE PRECISION;
