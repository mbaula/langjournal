import type { FlashcardProficiency, Prisma } from "@prisma/client";

import { extractExampleSentence } from "@/lib/flashcards/example-sentence";
import { proficiencyAfterPracticeResponse } from "@/lib/flashcards/proficiency";
import {
  type FlashcardPracticeStats,
  type FlashcardRecord,
  type PracticeResponse,
} from "@/lib/flashcards/types";
import type { InlineTranslation } from "@/lib/entries/translate";
import { prisma } from "@/lib/db/prisma";

type FlashcardWithEntry = Prisma.FlashcardGetPayload<{
  include: { entry: { select: { title: true } } };
}>;

function serializeFlashcard(card: FlashcardWithEntry): FlashcardRecord {
  return {
    id: card.id,
    word: card.word,
    translation: card.translation,
    exampleSentence: card.exampleSentence,
    hasAudio: Boolean(card.audioMimeType),
    audioMimeType: card.audioMimeType,
    languageCode: card.languageCode,
    proficiency: card.proficiency,
    entryId: card.entryId,
    entryTitle: card.entry?.title ?? null,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

function parseDateOnly(input: string): Date {
  const [y, m, d] = input.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export type ListFlashcardsFilters = {
  q?: string;
  proficiency?: FlashcardProficiency;
  language?: string;
  addedAfter?: string;
  addedBefore?: string;
};

export async function listFlashcardsForUser(
  userId: string,
  filters: ListFlashcardsFilters = {},
): Promise<FlashcardRecord[]> {
  const where: Prisma.FlashcardWhereInput = { userId };

  if (filters.q?.trim()) {
    where.OR = [
      { word: { contains: filters.q.trim(), mode: "insensitive" } },
      { translation: { contains: filters.q.trim(), mode: "insensitive" } },
    ];
  }

  if (filters.proficiency) {
    where.proficiency = filters.proficiency;
  }

  if (filters.language) {
    where.languageCode = filters.language;
  }

  if (filters.addedAfter) {
    where.createdAt = {
      ...(where.createdAt as Prisma.DateTimeFilter | undefined),
      gte: parseDateOnly(filters.addedAfter),
    };
  }

  if (filters.addedBefore) {
    const end = parseDateOnly(filters.addedBefore);
    end.setUTCDate(end.getUTCDate() + 1);
    where.createdAt = {
      ...(where.createdAt as Prisma.DateTimeFilter | undefined),
      lt: end,
    };
  }

  const cards = await prisma.flashcard.findMany({
    where,
    include: { entry: { select: { title: true } } },
    orderBy: [{ createdAt: "desc" }],
  });

  return cards.map(serializeFlashcard);
}

export async function getFlashcardForUser(
  flashcardId: string,
  userId: string,
): Promise<FlashcardRecord | null> {
  const card = await prisma.flashcard.findFirst({
    where: { id: flashcardId, userId },
    include: { entry: { select: { title: true } } },
  });
  return card ? serializeFlashcard(card) : null;
}

export async function updateFlashcardForUser(
  flashcardId: string,
  userId: string,
  data: {
    word?: string;
    translation?: string;
    exampleSentence?: string | null;
    proficiency?: FlashcardProficiency;
  },
): Promise<FlashcardRecord | null> {
  const existing = await prisma.flashcard.findFirst({
    where: { id: flashcardId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  try {
    const card = await prisma.flashcard.update({
      where: { id: flashcardId },
      data,
      include: { entry: { select: { title: true } } },
    });
    return serializeFlashcard(card);
  } catch {
    return null;
  }
}

export async function deleteFlashcardForUser(
  flashcardId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.flashcard.deleteMany({
    where: { id: flashcardId, userId },
  });
  return result.count > 0;
}

export async function setFlashcardAudioMimeType(
  flashcardId: string,
  userId: string,
  mimeType: string | null,
): Promise<FlashcardRecord | null> {
  const existing = await prisma.flashcard.findFirst({
    where: { id: flashcardId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const card = await prisma.flashcard.update({
    where: { id: flashcardId },
    data: { audioMimeType: mimeType },
    include: { entry: { select: { title: true } } },
  });
  return serializeFlashcard(card);
}

export async function upsertFlashcardFromTranslation(input: {
  userId: string;
  entryId: string;
  languageCode: string;
  translation: InlineTranslation;
  body?: string | null;
}): Promise<void> {
  const exampleSentence = extractExampleSentence(
    input.body,
    input.translation.spans?.[0],
  );

  await prisma.flashcard.upsert({
    where: {
      userId_languageCode_word: {
        userId: input.userId,
        languageCode: input.languageCode,
        word: input.translation.translatedText.trim(),
      },
    },
    create: {
      userId: input.userId,
      entryId: input.entryId,
      translationId: input.translation.id,
      languageCode: input.languageCode,
      word: input.translation.translatedText.trim(),
      translation: input.translation.sourceText.trim(),
      exampleSentence,
      proficiency: "NEW",
    },
    update: {
      entryId: input.entryId,
      translationId: input.translation.id,
      translation: input.translation.sourceText.trim(),
      exampleSentence: exampleSentence ?? undefined,
    },
  });
}

export async function syncFlashcardsFromJournalEntries(
  userId: string,
  targetLanguage: string,
): Promise<number> {
  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    select: { id: true, body: true, translations: true },
  });

  let createdOrUpdated = 0;

  for (const entry of entries) {
    const translations = Array.isArray(entry.translations)
      ? (entry.translations as InlineTranslation[])
      : [];

    for (const translation of translations) {
      if (
        !translation.translatedText?.trim() ||
        !translation.sourceText?.trim()
      ) {
        continue;
      }

      await upsertFlashcardFromTranslation({
        userId,
        entryId: entry.id,
        languageCode: targetLanguage,
        translation,
        body: entry.body,
      });
      createdOrUpdated += 1;
    }
  }

  return createdOrUpdated;
}

export async function getPracticeStatsForUser(
  userId: string,
): Promise<FlashcardPracticeStats> {
  const stats = await prisma.flashcardPracticeStats.findUnique({
    where: { userId },
  });

  return {
    currentStreak: stats?.currentStreak ?? 0,
    lastPracticeDate: stats?.lastPracticeDate
      ? stats.lastPracticeDate.toISOString().slice(0, 10)
      : null,
  };
}

function utcToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function utcYesterday(): Date {
  const today = utcToday();
  today.setUTCDate(today.getUTCDate() - 1);
  return today;
}

export async function completePracticeSession(input: {
  userId: string;
  reviews: Array<{ flashcardId: string; response: PracticeResponse }>;
}): Promise<{
  stats: FlashcardPracticeStats;
  masteredCount: number;
  cards: FlashcardRecord[];
}> {
  const cards: FlashcardRecord[] = [];
  let masteredCount = 0;

  for (const review of input.reviews) {
    const card = await prisma.flashcard.findFirst({
      where: { id: review.flashcardId, userId: input.userId },
    });
    if (!card) continue;

    const nextProficiency = proficiencyAfterPracticeResponse(
      card.proficiency,
      review.response,
    );

    if (nextProficiency === "MASTERED" && card.proficiency !== "MASTERED") {
      masteredCount += 1;
    }

    const updated = await prisma.flashcard.update({
      where: { id: card.id },
      data: { proficiency: nextProficiency },
      include: { entry: { select: { title: true } } },
    });
    cards.push(serializeFlashcard(updated));
  }

  const today = utcToday();
  const existingStats = await prisma.flashcardPracticeStats.findUnique({
    where: { userId: input.userId },
  });

  let currentStreak = 1;
  if (existingStats?.lastPracticeDate) {
    const last = existingStats.lastPracticeDate;
    const lastTime = last.getTime();
    const todayTime = today.getTime();
    const yesterdayTime = utcYesterday().getTime();

    if (lastTime === todayTime) {
      currentStreak = existingStats.currentStreak;
    } else if (lastTime === yesterdayTime) {
      currentStreak = existingStats.currentStreak + 1;
    }
  }

  const statsRow = await prisma.flashcardPracticeStats.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      currentStreak,
      lastPracticeDate: today,
    },
    update: {
      currentStreak,
      lastPracticeDate: today,
    },
  });

  return {
    stats: {
      currentStreak: statsRow.currentStreak,
      lastPracticeDate: statsRow.lastPracticeDate
        ? statsRow.lastPracticeDate.toISOString().slice(0, 10)
        : null,
    },
    masteredCount,
    cards,
  };
}

export async function listDistinctFlashcardLanguages(
  userId: string,
): Promise<string[]> {
  const rows = await prisma.flashcard.findMany({
    where: { userId },
    distinct: ["languageCode"],
    select: { languageCode: true },
    orderBy: { languageCode: "asc" },
  });
  return rows.map((row) => row.languageCode);
}
