import { describe, expect, it } from "vitest";

import { extractExampleSentence } from "@/lib/flashcards/example-sentence";
import { proficiencyAfterPracticeResponse } from "@/lib/flashcards/proficiency";
import { sortFlashcardsForPractice } from "@/lib/flashcards/practice";
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
