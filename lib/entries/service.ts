import { revalidateTag, unstable_cache } from "next/cache";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { InlineTranslation } from "@/lib/entries/translate";

export function utcCalendarDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function isUtcDateToday(entryDate: Date): boolean {
  return utcCalendarDate(entryDate).getTime() === utcCalendarDate(new Date()).getTime();
}

export function isPastJournalEntry(entryDate: Date | string): boolean {
  const date =
    typeof entryDate === "string" ? new Date(entryDate) : entryDate;
  return !isUtcDateToday(date);
}

export function isSavedJournalEntry(
  entry: {
    id: string;
    entryDate: Date | string;
    completedAt: Date | null;
  },
  activeDraftId: string,
): boolean {
  if (entry.id === activeDraftId) {
    return false;
  }
  return entry.completedAt != null || isPastJournalEntry(entry.entryDate);
}

const getCachedJournalEntriesList = unstable_cache(
  async (userId: string) => {
    return prisma.journalEntry.findMany({
      where: { userId },
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        body: true,
        translations: true,
        entryDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
  ["journal-entries-list"],
  { revalidate: 30, tags: ["journal-entry"] },
);

export async function listJournalEntries(userId: string) {
  return getCachedJournalEntriesList(userId);
}

/** Same order as the journal list; includes body for sidebar preview when title is empty. */
export async function listJournalRecentsForSidebar(userId: string) {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { entryDate: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      entryDate: true,
    },
  });
}

const getCachedEntry = unstable_cache(
  async (entryId: string, userId: string) => {
    return prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
      select: {
        id: true,
        title: true,
        body: true,
        translations: true,
        entryDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
  ["journal-entry"],
  { revalidate: 30, tags: ["journal-entry"] }
);

export async function getJournalEntryForUser(entryId: string, userId: string) {
  return getCachedEntry(entryId, userId);
}

export async function getOrCreateJournalEntryForDate(
  userId: string,
  entryDate: Date,
  title?: string | null,
) {
  const day = utcCalendarDate(entryDate);

  const existing = await prisma.journalEntry.findFirst({
    where: {
      userId,
      entryDate: day,
      completedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return { entry: existing, created: false as const };
  }

  const entry = await prisma.journalEntry.create({
    data: {
      userId,
      entryDate: day,
      title: title ?? null,
    },
  });

  return { entry, created: true as const };
}

export async function updateJournalEntryTitle(
  entryId: string,
  userId: string,
  rawTitle: string,
) {
  const normalized = rawTitle.trim() ? rawTitle.trim() : null;

  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: { id: true },
  });

  if (!entry) {
    return { ok: false as const, error: "not_found" as const };
  }

  await prisma.journalEntry.update({
    where: { id: entryId },
    data: { title: normalized },
  });

  revalidateTag("journal-entry", { expire: 0 });
  return { ok: true as const };
}

export async function updateJournalEntryBody(
  entryId: string,
  userId: string,
  rawBody: string,
) {
  const body = rawBody.replace(/\r\n/g, "\n");

  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: { id: true },
  });

  if (!entry) {
    return { ok: false as const, error: "not_found" as const };
  }

  await prisma.journalEntry.update({
    where: { id: entryId },
    data: { body },
  });

  revalidateTag("journal-entry", { expire: 0 });
  return { ok: true as const };
}

export async function updateJournalEntryTranslations(
  entryId: string,
  userId: string,
  translations: InlineTranslation[],
) {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: { id: true },
  });

  if (!entry) {
    return { ok: false as const, error: "not_found" as const };
  }

  await prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      translations: translations as Prisma.InputJsonValue,
    },
  });

  revalidateTag("journal-entry", { expire: 0 });
  return { ok: true as const };
}

export async function finishJournalEntryForToday(
  entryId: string,
  userId: string,
  snapshot?: {
    title?: string;
    body?: string;
    translations?: InlineTranslation[];
  },
) {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId, completedAt: null },
    select: {
      id: true,
      title: true,
      body: true,
      translations: true,
      entryDate: true,
      promptIndex: true,
      promptLevel: true,
    },
  });

  if (!entry) {
    return { ok: false as const, error: "not_found" as const };
  }

  const title =
    snapshot?.title !== undefined
      ? snapshot.title.trim()
        ? snapshot.title.trim()
        : null
      : entry.title;
  const body =
    snapshot?.body !== undefined
      ? snapshot.body.replace(/\r\n/g, "\n")
      : (entry.body ?? "");
  const filteredTranslations =
    snapshot?.translations !== undefined
      ? snapshot.translations.filter(
          (translation) => !translation.id.startsWith("opt-"),
        )
      : undefined;

  const hasContent = Boolean(title?.trim() || body.trim());
  if (!hasContent) {
    return { ok: false as const, error: "empty" as const };
  }

  const completedAt = new Date();

  const { completedEntry, newEntry } = await prisma.$transaction(async (tx) => {
    const completedEntry = await tx.journalEntry.update({
      where: { id: entryId },
      data: {
        title,
        body,
        ...(filteredTranslations !== undefined
          ? { translations: filteredTranslations }
          : {}),
        completedAt,
      },
      select: {
        id: true,
        title: true,
        body: true,
        translations: true,
        entryDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const newEntry = await tx.journalEntry.create({
      data: {
        userId,
        entryDate: entry.entryDate,
      },
      select: {
        id: true,
        title: true,
        body: true,
        translations: true,
        entryDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { completedEntry, newEntry };
  });

  revalidateTag("journal-entry", { expire: 0 });

  return {
    ok: true as const,
    completedEntry,
    newEntry,
    previousPrompt:
      entry.promptLevel != null && entry.promptIndex != null
        ? { level: entry.promptLevel, index: entry.promptIndex }
        : null,
  };
}

export async function deleteJournalEntryForUser(
  entryId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: "not_found" }> {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: { id: true },
  });

  if (!entry) {
    return { ok: false, error: "not_found" };
  }

  await prisma.journalEntry.delete({
    where: { id: entryId },
  });

  revalidateTag("journal-entry", { expire: 0 });
  return { ok: true };
}

export type LearningLanguageStat = {
  languageCode: string;
  level: string;
};

export type JournalStats = {
  total: number;
  translationCount: number;
  thisWeek: number;
  thisMonth: number;
  learningLanguages: LearningLanguageStat[];
};

function countStoredTranslations(translations: unknown): number {
  return Array.isArray(translations) ? translations.length : 0;
}

function getUtcIsoWeekStart(d: Date): Date {
  const date = utcCalendarDate(d);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diff));
}

function getUtcMonthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function getJournalStats(userId: string): Promise<JournalStats> {
  return getCachedJournalStats(userId);
}

const getCachedJournalStats = unstable_cache(
  async (userId: string): Promise<JournalStats> => {
    const now = new Date();
    const weekStart = getUtcIsoWeekStart(now);
    const monthStart = getUtcMonthStart(now);

    const [total, thisWeek, thisMonth, entries, learningLanguages] =
      await Promise.all([
        prisma.journalEntry.count({ where: { userId } }),
        prisma.journalEntry.count({
          where: { userId, entryDate: { gte: weekStart } },
        }),
        prisma.journalEntry.count({
          where: { userId, entryDate: { gte: monthStart } },
        }),
        prisma.journalEntry.findMany({
          where: { userId },
          select: { translations: true },
        }),
        prisma.userLanguage.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: { languageCode: true, level: true },
        }),
      ]);

    const translationCount = entries.reduce(
      (sum, entry) => sum + countStoredTranslations(entry.translations),
      0,
    );

    return {
      total,
      translationCount,
      thisWeek,
      thisMonth,
      learningLanguages,
    };
  },
  ["journal-stats"],
  { revalidate: 30, tags: ["journal-entry"] },
);

export type ContributionDay = {
  date: string;
  count: number;
};

export async function getContributionData(
  userId: string,
  days: number = 365,
): Promise<ContributionDay[]> {
  return getCachedContributionData(userId, days);
}

const getCachedContributionData = unstable_cache(
  async (userId: string, days: number): Promise<ContributionDay[]> => {
    const now = new Date();
    const todayUtc = utcCalendarDate(now);
    const startDate = new Date(
      Date.UTC(
        todayUtc.getUTCFullYear(),
        todayUtc.getUTCMonth(),
        todayUtc.getUTCDate() - days + 1,
      ),
    );

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        entryDate: { gte: startDate },
      },
      select: { entryDate: true },
    });

    const countByDate = new Map<string, number>();
    for (const entry of entries) {
      const key = entry.entryDate.toISOString().slice(0, 10);
      countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
    }

    const result: ContributionDay[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(
        Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate() + i,
        ),
      );
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: countByDate.get(key) ?? 0 });
    }

    return result;
  },
  ["journal-contributions"],
  { revalidate: 30, tags: ["journal-entry"] },
);
