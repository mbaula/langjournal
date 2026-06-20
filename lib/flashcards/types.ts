import type { FlashcardProficiency } from "@prisma/client";

export type FlashcardRecord = {
  id: string;
  word: string;
  translation: string;
  exampleSentence: string | null;
  hasAudio: boolean;
  audioMimeType: string | null;
  languageCode: string;
  proficiency: FlashcardProficiency;
  entryId: string | null;
  entryTitle: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardPracticeStats = {
  currentStreak: number;
  lastPracticeDate: string | null;
};

export type PracticeResponse = "still_learning" | "almost" | "got_it";

export const PROFICIENCY_LABELS: Record<FlashcardProficiency, string> = {
  NEW: "New",
  LEARNING: "Learning",
  FAMILIAR: "Familiar",
  MASTERED: "Mastered",
};

export const PROFICIENCY_ORDER: FlashcardProficiency[] = [
  "NEW",
  "LEARNING",
  "FAMILIAR",
  "MASTERED",
];

export const PRACTICE_PRIORITY: Record<FlashcardProficiency, number> = {
  NEW: 0,
  LEARNING: 1,
  FAMILIAR: 2,
  MASTERED: 3,
};
