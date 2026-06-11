import type { FlashcardProficiency } from "@prisma/client";

import {
  PROFICIENCY_ORDER,
  type PracticeResponse,
} from "@/lib/flashcards/types";

function proficiencyIndex(level: FlashcardProficiency): number {
  return PROFICIENCY_ORDER.indexOf(level);
}

/** Maps a practice self-report to the next proficiency level. */
export function proficiencyAfterPracticeResponse(
  current: FlashcardProficiency,
  response: PracticeResponse,
): FlashcardProficiency {
  const idx = proficiencyIndex(current);

  switch (response) {
    case "still_learning":
      if (idx <= 0) return "NEW";
      if (idx === 1) return "LEARNING";
      return "LEARNING";
    case "almost":
      if (idx <= 0) return "LEARNING";
      if (idx === 1) return "FAMILIAR";
      return current;
    case "got_it":
      if (idx >= PROFICIENCY_ORDER.length - 1) return "MASTERED";
      return PROFICIENCY_ORDER[idx + 1]!;
    default:
      return current;
  }
}
