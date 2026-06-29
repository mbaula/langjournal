import { Prisma } from "@prisma/client";

/** Saved journal entries — only after the user presses Save (finish). */
export function isEntrySavedForFlashcards(entry: {
  completedAt: Date | null;
}): boolean {
  return entry.completedAt != null;
}

export function savedJournalEntriesWhere(
  userId: string,
): Prisma.JournalEntryWhereInput {
  return {
    userId,
    completedAt: { not: null },
  };
}

/** @deprecated Use savedJournalEntriesWhere */
export const savedFlashcardEntriesWhere = savedJournalEntriesWhere;
