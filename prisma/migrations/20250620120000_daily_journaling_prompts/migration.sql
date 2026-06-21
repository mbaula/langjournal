-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN "promptIndex" INTEGER,
ADD COLUMN "promptLevel" "CefrLevel";

-- AlterTable
ALTER TABLE "UserLanguage" ADD COLUMN "currentPromptLevel" "CefrLevel",
ADD COLUMN "seenPromptIndexes" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "tooEasyStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tooHardStreak" INTEGER NOT NULL DEFAULT 0;

-- Backfill currentPromptLevel from estimatedCefrLevel
UPDATE "UserLanguage" SET "currentPromptLevel" = "estimatedCefrLevel" WHERE "currentPromptLevel" IS NULL;
