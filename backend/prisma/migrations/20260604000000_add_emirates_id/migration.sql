-- AlterTable
ALTER TABLE "patient_profiles" ADD COLUMN IF NOT EXISTS "emirates_id" TEXT UNIQUE;
