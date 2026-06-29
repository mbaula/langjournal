import { describe, expect, it } from "vitest";

import { extractExampleSentence } from "@/lib/flashcards/example-sentence";
import { groupFlashcardsByEntry } from "@/lib/flashcards/library-sort";
import { proficiencyAfterPracticeResponse } from "@/lib/flashcards/proficiency";
import { sortFlashcardsForPractice } from "@/lib/flashcards/practice";
import {
  collectDisplayableTranslations,
  collectPersistedTranslations,
  isPersistedJournalTranslation,
} from "@/lib/flashcards/sync-translations";
import type { FlashcardRecord } from "@/lib/flashcards/types";

describe("extractExampleSentence", () => {
  it("returns the line containing the highlight span", () => {
    const body = "First line\nSecond line with word\nThird line";
    const span = { start: 23, end: 27 };
    expect(extractExampleSentence(body, span)).toBe("Second line with word");
  });
});

describe("proficiencyAfterPracticeResponse", () => {
  it("advances on got it", () => {
    expect(proficiencyAfterPracticeResponse("NEW", "got_it")).toBe("LEARNING");
    expect(proficiencyAfterPracticeResponse("MASTERED", "got_it")).toBe(
      "MASTERED",
    );
  });

  it("holds or softens on still learning", () => {
    expect(proficiencyAfterPracticeResponse("FAMILIAR", "still_learning")).toBe(
      "LEARNING",
    );
  });
});

describe("sortFlashcardsForPractice", () => {
  it("prioritizes new and learning cards", () => {
    const cards: FlashcardRecord[] = [
      {
        id: "1",
        word: "a",
        translation: "a",
        exampleSentence: null,
        hasAudio: false,
        audioMimeType: null,
        languageCode: "fr",
        proficiency: "FAMILIAR",
        entryId: null,
        entryTitle: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        word: "b",
        translation: "b",
        exampleSentence: null,
        hasAudio: false,
        audioMimeType: null,
        languageCode: "fr",
        proficiency: "NEW",
        entryId: null,
        entryTitle: null,
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ];

    expect(sortFlashcardsForPractice(cards).map((card) => card.id)).toEqual([
      "2",
      "1",
    ]);
  });
});

function card(input: Partial<FlashcardRecord> & Pick<FlashcardRecord, "id">): FlashcardRecord {
  return {
    word: "bonjour",
    translation: "hello",
    exampleSentence: null,
    hasAudio: false,
    audioMimeType: null,
    languageCode: "fr",
    proficiency: "NEW",
    entryId: "entry-a",
    entryTitle: "Entry A",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...input,
  };
}

describe("isPersistedJournalTranslation", () => {
  it("accepts saved journal translations", () => {
    expect(
      isPersistedJournalTranslation({
        id: "t1",
        sourceText: "hello",
        translatedText: "bonjour",
      }),
    ).toBe(true);
  });

  it("rejects optimistic client-only translations", () => {
    expect(
      isPersistedJournalTranslation({
        id: "opt-123",
        sourceText: "hello",
        translatedText: "bonjour",
      }),
    ).toBe(false);
  });
});

describe("collectPersistedTranslations", () => {
  it("returns only persisted translations from entry JSON", () => {
    expect(
      collectPersistedTranslations([
        { id: "t1", sourceText: "a", translatedText: "b" },
        { id: "opt-2", sourceText: "c", translatedText: "d" },
        { id: "t3", sourceText: "", translatedText: "e" },
      ]),
    ).toEqual([{ id: "t1", sourceText: "a", translatedText: "b" }]);
  });
});

describe("collectDisplayableTranslations", () => {
  it("includes optimistic translations for display", () => {
    expect(
      collectDisplayableTranslations([
        { id: "t1", sourceText: "a", translatedText: "b" },
        { id: "opt-2", sourceText: "c", translatedText: "d" },
        { id: "t3", sourceText: "", translatedText: "e" },
      ]),
    ).toEqual([
      { id: "t1", sourceText: "a", translatedText: "b" },
      { id: "opt-2", sourceText: "c", translatedText: "d" },
    ]);
  });
});

describe("groupFlashcardsByEntry", () => {
  it("keeps duplicate target words from different entries in separate groups", () => {
    const groups = groupFlashcardsByEntry([
      card({
        id: "1",
        entryId: "entry-a",
        entryTitle: "Morning",
        word: "bonjour",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      card({
        id: "2",
        entryId: "entry-b",
        entryTitle: "Evening",
        word: "bonjour",
        createdAt: "2026-01-02T00:00:00.000Z",
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.entryTitle).toBe("Evening");
    expect(groups[1]?.entryTitle).toBe("Morning");
    expect(groups.flatMap((group) => group.cards)).toHaveLength(2);
  });

  it("orders cards within an entry by createdAt, not updatedAt", () => {
    const groups = groupFlashcardsByEntry([
      card({
        id: "older",
        entryId: "entry-a",
        word: "chat",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-06-02T00:00:00.000Z",
      }),
      card({
        id: "newer",
        entryId: "entry-a",
        word: "chien",
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      }),
    ]);

    expect(groups[0]?.cards.map((item) => item.id)).toEqual(["older", "newer"]);
  });
});
