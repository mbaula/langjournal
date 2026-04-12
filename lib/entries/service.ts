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

export async function getJournalEntryForUser(entryId: string, userId: string) {
  return prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: {
      id: true,
      title: true,
      entryDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });
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
