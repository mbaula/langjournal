import { describe, expect, it, vi } from "vitest";

import {
  createJournalEntryBodySchema,
  parseEntryDate,
  patchJournalEntryBodySchema,
} from "@/lib/validations/entry";

describe("createJournalEntryBodySchema", () => {
  it("accepts optional valid fields", () => {
    const parsed = createJournalEntryBodySchema.safeParse({
      entryDate: "2026-04-27",
      title: "My title",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const parsed = createJournalEntryBodySchema.safeParse({
      entryDate: "04/27/2026",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown properties due to strict schema", () => {
    const parsed = createJournalEntryBodySchema.safeParse({
      title: "x",
      extra: "nope",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("parseEntryDate", () => {
  it("uses current date when no input provided", () => {
    const mockDate = new Date("2026-04-27T10:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    expect(parseEntryDate()).toEqual(mockDate);
    vi.useRealTimers();
  });

  it("parses YYYY-MM-DD as UTC date", () => {
    expect(parseEntryDate("2026-04-27").toISOString()).toBe(
      "2026-04-27T00:00:00.000Z",
    );
  });
});

describe("patchJournalEntryBodySchema", () => {
  it("accepts body-only or title-only patch payloads", () => {
    expect(patchJournalEntryBodySchema.safeParse({ title: "New title" }).success).toBe(
      true,
    );
    expect(patchJournalEntryBodySchema.safeParse({ body: "New body" }).success).toBe(
      true,
    );
  });

  it("rejects payload with neither title nor body", () => {
    const parsed = patchJournalEntryBodySchema.safeParse({});
    expect(parsed.success).toBe(false);
  });
});
