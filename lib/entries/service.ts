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
      entryDate: true,
      createdAt: true,
      updatedAt: true,
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
