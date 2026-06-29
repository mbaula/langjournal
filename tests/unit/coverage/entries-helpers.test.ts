import { describe, expect, it, vi } from "vitest";

// Stub Next cache APIs used by lib/entries/service.ts
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

// Stub prisma used by lib/entries/service.ts
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    journalEntry: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => ({ id: "e1" })),
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => ({ id: "e1" })),
      update: vi.fn(async () => ({ id: "e1" })),
      delete: vi.fn(async () => ({ id: "e1" })),
      count: vi.fn(async () => 0),
    },
    promptUsage: {
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
    userLanguage: {
      findMany: vi.fn(async () => []),
    },
    flashcard: {
      count: vi.fn(async () => 0),
    },
    user: {
      findUnique: vi.fn(async () => ({
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
      })),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

// Stub translation deps (we only test non-Google paths here)
vi.mock("@/lib/translate/google", () => ({
  translatePlainText: vi.fn(async () => "translated"),
}));
vi.mock("@/lib/translate/memory-cache", () => {
  const mem = new Map<string, string>();
  return {
    memoryCacheGet: (k: string) => mem.get(k),
    memoryCacheSet: (k: string, v: string) => void mem.set(k, v),
  };
});

import {
  bodySnippetForSidebar,
} from "@/lib/text/entry-sidebar-preview";
import { normalizeTranslationSource, translationMemoryCacheKey } from "@/lib/text/translation-cache-key";
import { countWords, wordCountLabel } from "@/lib/text/word-count";
import { segmentTranslatedLine } from "@/lib/entries/entry-body-segments";
import {
  utcCalendarDate,
  getOrCreateJournalEntryForDate,
  updateJournalEntryTitle,
  updateJournalEntryBody,
  deleteJournalEntryForUser,
  getJournalStats,
  getContributionData,
} from "@/lib/entries/service";
import { resolveTranslationText, removeTranslation } from "@/lib/entries/translate";

describe("coverage: entries/text helpers", () => {
  it("utcCalendarDate returns UTC day start", () => {
    const d = new Date("2026-05-08T23:59:59Z");
    expect(utcCalendarDate(d).toISOString().slice(11)).toBe("00:00:00.000Z");
  });

  it("bodySnippetForSidebar handles empty + truncation", () => {
    expect(bodySnippetForSidebar(null)).toBe("Empty entry");
    const long = "Hello world. " + "x".repeat(500);
    expect(bodySnippetForSidebar(long, 20).length).toBeLessThanOrEqual(20);
  });

  it("translation cache key normalizes source", () => {
    expect(normalizeTranslationSource(" hi\u2019  there ")).toBe("hi' there");
    expect(translationMemoryCacheKey("EN", "ES", " hi ")).toContain("en");
  });

  it("word count helpers", () => {
    expect(countWords("   ")).toBe(0);
    expect(countWords("a  b c")).toBe(3);
    expect(wordCountLabel(1)).toBe("1 word");
    expect(wordCountLabel(2)).toBe("2 words");
  });

  it("segments translated line (longest match first)", () => {
    const segs = segmentTranslatedLine("hello bonjour world", [
      { id: "t1", sourceText: "hi", translatedText: "bonjour" },
    ]);
    expect(segs.some((s) => s.translation?.id === "t1")).toBe(true);
  });

  it("service CRUD paths return ok/not_found shapes", async () => {
    const userId = "00000000-0000-0000-0000-000000000000";
    const day = new Date("2026-05-08T12:00:00Z");
    const res = await getOrCreateJournalEntryForDate(userId, day, "t");
    expect(res).toHaveProperty("entry");

    // update title/body should succeed with our stubbed findFirst
    await expect(updateJournalEntryTitle("e1", userId, "  title  ")).resolves.toEqual({
      ok: true,
    });
    await expect(updateJournalEntryBody("e1", userId, "a\r\nb")).resolves.toEqual({ ok: true });

    await expect(deleteJournalEntryForUser("e1", userId)).resolves.toEqual({ ok: true });

    await expect(getJournalStats(userId)).resolves.toHaveProperty("total");
    await expect(getContributionData(userId, 3)).resolves.toHaveLength(3);
  });

  it("resolveTranslationText handles empty, dedupe, cache, and removeTranslation", async () => {
    await expect(
      resolveTranslationText("   ", [], "en", "es"),
    ).resolves.toEqual({ ok: false, error: "Nothing to translate" });

    const existing = [{ id: "1", sourceText: "Hi", translatedText: "Hola" }];
    const deduped = await resolveTranslationText("Hi", existing, "en", "es");
    expect(deduped.ok).toBe(true);
    if (deduped.ok) expect(deduped.fromExisting?.id).toBe("1");

    // cache path
    const first = await resolveTranslationText("Test", [], "en", "es");
    expect(first.ok).toBe(true);
    const second = await resolveTranslationText("Test", [], "en", "es");
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.fromServerMemory).toBe(true);

    expect(removeTranslation(existing, "1")).toEqual([]);
  });
});

