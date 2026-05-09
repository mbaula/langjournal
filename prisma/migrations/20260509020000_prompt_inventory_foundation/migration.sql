-- CreateEnum
CREATE TYPE "PromptMode" AS ENUM ('ACADEMIC', 'FUN');

-- CreateEnum
CREATE TYPE "PromptStatus" AS ENUM ('ACTIVE', 'DISABLED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "PromptSource" AS ENUM ('CURATED', 'LLM_GENERATED');

-- CreateTable
CREATE TABLE "Prompt" (
  "id" TEXT NOT NULL,
  "languageCode" TEXT NOT NULL DEFAULT 'any',
  "mode" "PromptMode" NOT NULL,
  "minCefr" "CefrLevel" NOT NULL,
  "maxCefr" "CefrLevel" NOT NULL,
  "topicTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "safetyTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "requiredWords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "promptText" TEXT NOT NULL,
  "status" "PromptStatus" NOT NULL DEFAULT 'ACTIVE',
  "source" "PromptSource" NOT NULL DEFAULT 'CURATED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PromptUsage" (
  "id" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "promptId" TEXT NOT NULL,
  "entryId" UUID,
  "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PromptUsage_pkey" PRIMARY KEY ("id")
);

-- AddPrimaryKey
ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Prompt_languageCode_mode_idx" ON "Prompt"("languageCode", "mode");

-- CreateIndex
CREATE INDEX "Prompt_status_idx" ON "Prompt"("status");

-- CreateIndex
CREATE INDEX "PromptUsage_userId_usedAt_idx" ON "PromptUsage"("userId", "usedAt");

-- CreateIndex
CREATE INDEX "PromptUsage_promptId_usedAt_idx" ON "PromptUsage"("promptId", "usedAt");

-- AddForeignKey
ALTER TABLE "PromptUsage" ADD CONSTRAINT "PromptUsage_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

