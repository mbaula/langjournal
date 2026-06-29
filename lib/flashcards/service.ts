import { Prisma, type FlashcardProficiency } from "@prisma/client";

import { extractExampleSentence } from "@/lib/flashcards/example-sentence";
import { proficiencyAfterPracticeResponse } from "@/lib/flashcards/proficiency";
import {
  collectPersistedTranslations,
  isPersistedJournalTranslation,
} from "@/lib/flashcards/sync-translations";
import { getLanguagePair } from "@/lib/db/language";
import { savedFlashcardEntriesWhere } from "@/lib/entries/saved-entry";
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
    translationId: card.translationId,
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
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });

  return cards.map(serializeFlashcard);
}

function flashcardFromJournalTranslation(
  entry: {
    id: string;
    title: string | null;
    updatedAt: Date;
  },
  translation: InlineTranslation,
  languageCode: string,
): FlashcardRecord {
  return {
    id: `journal-${entry.id}-${translation.id}`,
    word: translation.translatedText.trim(),
    translation: translation.sourceText.trim(),
    exampleSentence: null,
    hasAudio: false,
    audioMimeType: null,
    languageCode,
    proficiency: "NEW",
    entryId: entry.id,
    entryTitle: entry.title,
    translationId: translation.id,
    createdAt: entry.updatedAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

/** Lists flashcards from saved journal entries, merged with DB rows when present. */
export async function listFlashcardsForUserDisplay(
  userId: string,
  targetLanguage: string,
  filters: ListFlashcardsFilters = {},
): Promise<FlashcardRecord[]> {
  const [dbCards, savedEntries] = await Promise.all([
    listFlashcardsForUser(userId, filters).catch((error) => {
      console.error("Flashcard table query failed:", error);
      return [] as FlashcardRecord[];
    }),
    prisma.journalEntry
      .findMany({
        where: savedFlashcardEntriesWhere(userId),
        select: {
          id: true,
          title: true,
          translations: true,
          updatedAt: true,
        },
        orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }, { id: "asc" }],
      })
      .catch((error) => {
        console.error("Saved journal entry query failed for flashcards:", error);
        return [];
      }),
  ]);

  const savedEntryIds = new Set(savedEntries.map((entry) => entry.id));
  const dbByTranslationId = new Map<string, FlashcardRecord>();
  for (const card of dbCards) {
    if (card.translationId) {
      dbByTranslationId.set(card.translationId, card);
    }
  }

  const merged: FlashcardRecord[] = [];
  const seenTranslationIds = new Set<string>();

  for (const entry of savedEntries) {
    for (const translation of collectPersistedTranslations(entry.translations)) {
      seenTranslationIds.add(translation.id);
      merged.push(
        dbByTranslationId.get(translation.id) ??
          flashcardFromJournalTranslation(entry, translation, targetLanguage),
      );
    }
  }

  for (const card of dbCards) {
    if (card.translationId && seenTranslationIds.has(card.translationId)) {
      continue;
    }
    if (card.entryId && savedEntryIds.has(card.entryId)) {
      merged.push(card);
    }
  }

  return merged;
}

/** Same count shown on Practice and Progress — translations from saved entries. */
export async function countFlashcardsForUserDisplay(
  userId: string,
): Promise<number> {
  const { target } = await getLanguagePair(userId);
  const cards = await listFlashcardsForUserDisplay(userId, target);
  return cards.length;
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
  if (!isPersistedJournalTranslation(input.translation)) {
    return;
  }

  const translationId = input.translation.id.trim();
  const word = input.translation.translatedText.trim();
  const translation = input.translation.sourceText.trim();
  const exampleSentence = extractExampleSentence(
    input.body,
    input.translation.spans?.[0],
  );

  const payload = {
    entryId: input.entryId,
    translationId,
    languageCode: input.languageCode,
    word,
    translation,
    exampleSentence,
  };

  async function updateFlashcardRecord(cardId: string) {
    try {
      await prisma.flashcard.update({
        where: { id: cardId },
        data: {
          ...payload,
          exampleSentence: exampleSentence ?? undefined,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const conflict = await prisma.flashcard.findFirst({
          where: {
            userId: input.userId,
            languageCode: input.languageCode,
            word,
          },
          select: { id: true },
        });

        if (conflict && conflict.id !== cardId) {
          await prisma.flashcard.delete({ where: { id: conflict.id } });
          await prisma.flashcard.update({
            where: { id: cardId },
            data: {
              ...payload,
              exampleSentence: exampleSentence ?? undefined,
            },
          });
          return;
        }
      }

      throw error;
    }
  }

  const byTranslationId = await prisma.flashcard.findFirst({
    where: { userId: input.userId, translationId },
    select: { id: true },
  });

  if (byTranslationId) {
    await updateFlashcardRecord(byTranslationId.id);
    return;
  }

  const byEntryWord = await prisma.flashcard.findFirst({
    where: {
      userId: input.userId,
      entryId: input.entryId,
      languageCode: input.languageCode,
      word,
    },
    select: { id: true },
  });

  if (byEntryWord) {
    await updateFlashcardRecord(byEntryWord.id);
    return;
  }

  try {
    await prisma.flashcard.create({
      data: {
        userId: input.userId,
        proficiency: "NEW",
        ...payload,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const byWord = await prisma.flashcard.findFirst({
        where: {
          userId: input.userId,
          languageCode: input.languageCode,
          word,
        },
        select: { id: true },
      });

      if (byWord) {
        await updateFlashcardRecord(byWord.id);
      }
      return;
    }

    throw error;
  }
}

export async function syncFlashcardsForEntry(
  userId: string,
  entryId: string,
  targetLanguage: string,
): Promise<number> {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: { id: true, body: true, translations: true },
  });

  if (!entry) {
    return 0;
  }

  let synced = 0;
  for (const translation of collectPersistedTranslations(entry.translations)) {
    try {
      await upsertFlashcardFromTranslation({
        userId,
        entryId: entry.id,
        languageCode: targetLanguage,
        translation,
        body: entry.body,
      });
      synced += 1;
    } catch (error) {
      console.error("Failed to sync flashcard from journal translation:", error);
    }
  }

  return synced;
}

export async function syncFlashcardsFromJournalEntries(
  userId: string,
  targetLanguage: string,
): Promise<number> {
  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    select: { id: true, body: true, translations: true },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }, { id: "asc" }],
  });

  let createdOrUpdated = 0;

  for (const entry of entries) {
    for (const translation of collectPersistedTranslations(entry.translations)) {
      try {
        await upsertFlashcardFromTranslation({
          userId,
          entryId: entry.id,
          languageCode: targetLanguage,
          translation,
          body: entry.body,
        });
        createdOrUpdated += 1;
      } catch (error) {
        console.error("Failed to sync flashcard from journal translation:", error);
      }
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
