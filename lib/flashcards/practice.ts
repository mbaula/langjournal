import {
  PRACTICE_PRIORITY,
  type FlashcardRecord,
} from "@/lib/flashcards/types";

export function sortFlashcardsForPractice(
  cards: FlashcardRecord[],
): FlashcardRecord[] {
  return [...cards].sort((a, b) => {
    const priorityDiff =
      PRACTICE_PRIORITY[a.proficiency] - PRACTICE_PRIORITY[b.proficiency];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
