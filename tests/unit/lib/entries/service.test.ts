import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateTagMock, prismaMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
  prismaMock: {
    journalEntry: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    userLanguage: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

import {
  deleteJournalEntryForUser,
  getContributionData,
  getJournalEntryForUser,
  getJournalStats,
  getOrCreateJournalEntryForDate,
  listJournalEntries,
  listJournalRecentsForSidebar,
  updateJournalEntryBody,
  updateJournalEntryTitle,
  utcCalendarDate,
} from "@/lib/entries/service";

describe("utcCalendarDate", () => {
  it("normalizes date to UTC calendar day", () => {
    const input = new Date("2026-04-27T22:14:40.000Z");
    expect(utcCalendarDate(input).toISOString()).toBe("2026-04-27T00:00:00.000Z");
  });
});

describe("listJournalEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests entries ordered by date descending", async () => {
    prismaMock.journalEntry.findMany.mockResolvedValueOnce([{ id: "e1" }]);
    const result = await listJournalEntries("u1");

    expect(prismaMock.journalEntry.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
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
    expect(result).toEqual([{ id: "e1" }]);
  });
});

describe("listJournalRecentsForSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns light rows for sidebar preview", async () => {
    prismaMock.journalEntry.findMany.mockResolvedValueOnce([
      { id: "e1", title: "Hi", body: null, entryDate: new Date("2026-05-04T00:00:00.000Z") },
    ]);
    const result = await listJournalRecentsForSidebar("u1");

    expect(prismaMock.journalEntry.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { entryDate: "desc" },
      select: { id: true, title: true, body: true, entryDate: true },
    });
    expect(result).toEqual([
      { id: "e1", title: "Hi", body: null, entryDate: new Date("2026-05-04T00:00:00.000Z") },
    ]);
  });
});

describe("getJournalEntryForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads entry scoped to the user", async () => {
    prismaMock.journalEntry.findFirst.mockResolvedValueOnce({
      id: "e1",
      title: "T",
      body: "B",
    });

    const result = await getJournalEntryForUser("e1", "u1");

    expect(prismaMock.journalEntry.findFirst).toHaveBeenCalledWith({
      where: { id: "e1", userId: "u1" },
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
    expect(result).toEqual({ id: "e1", title: "T", body: "B" });
  });
});

describe("getOrCreateJournalEntryForDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing entry when found", async () => {
    const existing = { id: "existing" };
    prismaMock.journalEntry.findUnique.mockResolvedValueOnce(existing);

    const result = await getOrCreateJournalEntryForDate(
      "u1",
      new Date("2026-04-27T19:25:00.000Z"),
      "title",
    );

    expect(result).toEqual({ entry: existing, created: false });
    expect(prismaMock.journalEntry.create).not.toHaveBeenCalled();
  });

  it("creates entry when not found", async () => {
    prismaMock.journalEntry.findUnique.mockResolvedValueOnce(null);
    prismaMock.journalEntry.create.mockResolvedValueOnce({ id: "new-entry" });

    const result = await getOrCreateJournalEntryForDate(
      "u1",
      new Date("2026-04-27T19:25:00.000Z"),
      " New title ",
    );

    expect(prismaMock.journalEntry.create).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        entryDate: new Date("2026-04-27T00:00:00.000Z"),
        title: " New title ",
      },
    });
    expect(result).toEqual({ entry: { id: "new-entry" }, created: true });
  });
});

describe("updateJournalEntryTitle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when entry does not belong to user", async () => {
    prismaMock.journalEntry.findFirst.mockResolvedValueOnce(null);

    const result = await updateJournalEntryTitle("e1", "u1", "Title");

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(prismaMock.journalEntry.update).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("trims title and updates entry", async () => {
    prismaMock.journalEntry.findFirst.mockResolvedValueOnce({ id: "e1" });
    prismaMock.journalEntry.update.mockResolvedValueOnce({ id: "e1" });

    const result = await updateJournalEntryTitle("e1", "u1", "  Updated  ");

    expect(prismaMock.journalEntry.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { title: "Updated" },
    });
    expect(revalidateTagMock).toHaveBeenCalledWith("journal-entry", { expire: 0 });
    expect(result).toEqual({ ok: true });
  });

  it("stores null title when input is whitespace", async () => {
    prismaMock.journalEntry.findFirst.mockResolvedValueOnce({ id: "e1" });
    prismaMock.journalEntry.update.mockResolvedValueOnce({ id: "e1" });

    await updateJournalEntryTitle("e1", "u1", "   ");

    expect(prismaMock.journalEntry.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { title: null },
    });
  });
});

describe("updateJournalEntryBody", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when entry does not belong to user", async () => {
    prismaMock.journalEntry.findFirst.mockResolvedValueOnce(null);

    const result = await updateJournalEntryBody("e1", "u1", "body");

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(prismaMock.journalEntry.update).not.toHaveBeenCalled();
  });

  it("normalizes CRLF to LF and updates entry", async () => {
    prismaMock.journalEntry.findFirst.mockResolvedValueOnce({ id: "e1" });
    prismaMock.journalEntry.update.mockResolvedValueOnce({ id: "e1" });

    const result = await updateJournalEntryBody("e1", "u1", "a\r\nb");

    expect(prismaMock.journalEntry.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { body: "a\nb" },
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("getJournalStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates counts, translations, and learning languages", async () => {
    prismaMock.journalEntry.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(7);
    prismaMock.journalEntry.findMany.mockResolvedValueOnce([
      { translations: [{ id: "t1" }, { id: "t2" }] },
      { translations: null },
      { translations: "not-an-array" },
    ]);
    prismaMock.userLanguage.findMany.mockResolvedValueOnce([
      { languageCode: "ja", level: "intermediate" },
    ]);

    const result = await getJournalStats("u1");

    expect(prismaMock.journalEntry.count).toHaveBeenCalledTimes(3);
    expect(prismaMock.userLanguage.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { createdAt: "asc" },
      select: { languageCode: true, level: true },
    });
    expect(result).toEqual({
      total: 10,
      translationCount: 2,
      thisWeek: 3,
      thisMonth: 7,
      learningLanguages: [{ languageCode: "ja", level: "intermediate" }],
    });
  });
});

describe("getContributionData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-20T12:00:00.000Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a day for each date in range with aggregated counts", async () => {
    prismaMock.journalEntry.findMany.mockResolvedValueOnce([
      { entryDate: new Date("2026-05-18T00:00:00.000Z") },
      { entryDate: new Date("2026-05-18T15:00:00.000Z") },
      { entryDate: new Date("2026-05-20T00:00:00.000Z") },
    ]);

    const result = await getContributionData("u1", 3);

    expect(result).toEqual([
      { date: "2026-05-18", count: 2 },
      { date: "2026-05-19", count: 0 },
      { date: "2026-05-20", count: 1 },
    ]);
    expect(prismaMock.journalEntry.findMany).toHaveBeenCalledWith({
      where: {
        userId: "u1",
        entryDate: { gte: new Date("2026-05-18T00:00:00.000Z") },
      },
      select: { entryDate: true },
    });
  });
});

describe("deleteJournalEntryForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when entry does not belong to user", async () => {
    prismaMock.journalEntry.findFirst.mockResolvedValueOnce(null);

    const result = await deleteJournalEntryForUser("e1", "u1");
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("deletes entry and revalidates cache", async () => {
    prismaMock.journalEntry.findFirst.mockResolvedValueOnce({ id: "e1" });
    prismaMock.journalEntry.delete.mockResolvedValueOnce({ id: "e1" });

    const result = await deleteJournalEntryForUser("e1", "u1");

    expect(prismaMock.journalEntry.delete).toHaveBeenCalledWith({
      where: { id: "e1" },
    });
    expect(revalidateTagMock).toHaveBeenCalledWith("journal-entry", { expire: 0 });
    expect(result).toEqual({ ok: true });
  });
});
