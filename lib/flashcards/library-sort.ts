import type { FlashcardRecord } from "@/lib/flashcards/types";

export const FLASHCARD_LIBRARY_SORT_OPTIONS = ["entry", "recent"] as const;

export type FlashcardLibrarySort = (typeof FLASHCARD_LIBRARY_SORT_OPTIONS)[number];

export const FLASHCARD_LIBRARY_SORT_LABELS: Record<
  FlashcardLibrarySort,
  string
> = {
  entry: "Entry",
  recent: "Recent",
};

export type FlashcardEntryGroup = {
  key: string;
  entryId: string | null;
  entryTitle: string | null;
  cards: FlashcardRecord[];
};

const NO_ENTRY_GROUP_KEY = "__no_entry__";

function compareDesc(aTime: number, bTime: number): number {
  return bTime - aTime;
}

function cardTimestamp(card: FlashcardRecord): number {
  return Date.parse(card.createdAt);
}

function compareAsc(aTime: number, bTime: number): number {
  return aTime - bTime;
}

export function entryGroupLabel(group: FlashcardEntryGroup): string {
  if (group.entryTitle?.trim()) return group.entryTitle.trim();
  if (group.entryId) return "Untitled entry";
  return "No linked entry";
}

export function sortFlashcardsForLibrary(
  cards: FlashcardRecord[],
  sort: FlashcardLibrarySort,
): FlashcardRecord[] {
  const copy = [...cards];
  if (sort === "recent") {
    copy.sort((a, b) => compareDesc(cardTimestamp(a), cardTimestamp(b)));
  }
  return copy;
}

export function groupFlashcardsByEntry(
  cards: FlashcardRecord[],
): FlashcardEntryGroup[] {
  const groups = new Map<string, FlashcardEntryGroup>();

  for (const card of cards) {
    const key = card.entryId ?? NO_ENTRY_GROUP_KEY;
    const existing = groups.get(key);
    if (existing) {
      existing.cards.push(card);
      continue;
    }

    groups.set(key, {
      key,
      entryId: card.entryId,
      entryTitle: card.entryTitle,
      cards: [card],
    });
  }

  const result = Array.from(groups.values());

  for (const group of result) {
    group.cards.sort((a, b) => {
      const timeDiff = compareAsc(cardTimestamp(a), cardTimestamp(b));
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });
  }

  result.sort((a, b) => {
    const aTime = Math.max(...a.cards.map(cardTimestamp));
    const bTime = Math.max(...b.cards.map(cardTimestamp));
    const timeDiff = compareDesc(aTime, bTime);
    if (timeDiff !== 0) return timeDiff;
    return (a.entryId ?? a.key).localeCompare(b.entryId ?? b.key);
  });

  return result;
}
