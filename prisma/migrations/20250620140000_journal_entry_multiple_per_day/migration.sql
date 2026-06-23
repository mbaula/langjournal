-- DropIndex
DROP INDEX "JournalEntry_userId_entryDate_key";

-- CreateIndex
CREATE INDEX "JournalEntry_userId_entryDate_idx" ON "JournalEntry"("userId", "entryDate");
