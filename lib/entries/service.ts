import { revalidateTag, unstable_cache } from "next/cache";

import { prisma } from "@/lib/db/prisma";

export function utcCalendarDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function listJournalEntries(userId: string) {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { entryDate: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      translations: true,
      entryDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });
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

  const existing = await prisma.journalEntry.findUnique({
    where: {
      userId_entryDate: { userId, entryDate: day },
    },
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

export type JournalStats = {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
};

function getUtcIsoWeekStart(d: Date): Date {
  const date = utcCalendarDate(d);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diff));
}

function getUtcMonthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function getUtcYearStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

export async function getJournalStats(userId: string): Promise<JournalStats> {
  const now = new Date();
  const todayStart = utcCalendarDate(now);
  const weekStart = getUtcIsoWeekStart(now);
  const monthStart = getUtcMonthStart(now);
  const yearStart = getUtcYearStart(now);

  const [total, today, thisWeek, thisMonth, thisYear] = await Promise.all([
    prisma.journalEntry.count({ where: { userId } }),
    prisma.journalEntry.count({
      where: { userId, entryDate: { gte: todayStart } },
    }),
    prisma.journalEntry.count({
      where: { userId, entryDate: { gte: weekStart } },
    }),
    prisma.journalEntry.count({
      where: { userId, entryDate: { gte: monthStart } },
    }),
    prisma.journalEntry.count({
      where: { userId, entryDate: { gte: yearStart } },
    }),
  ]);

  return { total, today, thisWeek, thisMonth, thisYear };
}

export type ContributionDay = {
  date: string;
  count: number;
};

export async function getContributionData(
  userId: string,
  days: number = 365,
): Promise<ContributionDay[]> {
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
}
