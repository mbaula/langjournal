-- CreateEnum
CREATE TYPE "FlashcardProficiency" AS ENUM ('NEW', 'LEARNING', 'FAMILIAR', 'MASTERED');

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "exampleSentence" TEXT,
    "audioMimeType" TEXT,
    "languageCode" TEXT NOT NULL,
    "proficiency" "FlashcardProficiency" NOT NULL DEFAULT 'NEW',
    "entryId" UUID,
    "translationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardPracticeStats" (
    "userId" UUID NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPracticeDate" DATE,

    CONSTRAINT "FlashcardPracticeStats_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "Flashcard_userId_proficiency_idx" ON "Flashcard"("userId", "proficiency");

-- CreateIndex
CREATE INDEX "Flashcard_userId_languageCode_idx" ON "Flashcard"("userId", "languageCode");

-- CreateIndex
CREATE INDEX "Flashcard_userId_createdAt_idx" ON "Flashcard"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Flashcard_userId_languageCode_word_key" ON "Flashcard"("userId", "languageCode", "word");

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardPracticeStats" ADD CONSTRAINT "FlashcardPracticeStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
