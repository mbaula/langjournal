-- One flashcard per journal translation (not per target-language word).
DROP INDEX "Flashcard_userId_languageCode_word_key";

CREATE UNIQUE INDEX "Flashcard_userId_translationId_key" ON "Flashcard"("userId", "translationId");
