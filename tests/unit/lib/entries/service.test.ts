import { beforeEach, describe, expect, it, vi } from "vitest";

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
  getOrCreateJournalEntryForDate,
  listJournalEntries,
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
        entryDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toEqual([{ id: "e1" }]);
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
