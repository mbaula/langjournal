-- CreateEnum
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "LevelConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "UserLanguage" ADD COLUMN "estimatedCefrLevel" "CefrLevel" NOT NULL DEFAULT 'A1';

-- AlterTable
ALTER TABLE "UserLanguage" ADD COLUMN "levelConfidence" "LevelConfidence" NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "UserLanguage" ADD COLUMN "estimatedLevelUpdatedAt" TIMESTAMP(3);

UPDATE "UserLanguage"
SET
  "estimatedCefrLevel" = CASE "level"
    WHEN 'beginner' THEN 'A1'::"CefrLevel"
    WHEN 'intermediate' THEN 'B1'::"CefrLevel"
    WHEN 'proficient' THEN 'B2'::"CefrLevel"
    ELSE 'A1'::"CefrLevel"
  END,
  "levelConfidence" = 'LOW'::"LevelConfidence",
  "estimatedLevelUpdatedAt" = CURRENT_TIMESTAMP;
