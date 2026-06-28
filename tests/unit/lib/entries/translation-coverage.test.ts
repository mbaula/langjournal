import { describe, expect, it } from "vitest";

import { translationCoveragePercent } from "@/lib/entries/translation-coverage";

describe("translationCoveragePercent", () => {
  it("returns 0 for empty body", () => {
    expect(translationCoveragePercent("", [])).toBe(0);
    expect(translationCoveragePercent(null, [])).toBe(0);
  });

  it("counts non-overlapping spans", () => {
    const body = "Hello world today";
    const percent = translationCoveragePercent(body, [
      {
        id: "1",
        sourceText: "world",
        translatedText: "world",
        spans: [{ start: 6, end: 11 }],
      },
    ]);
    expect(percent).toBe(Math.round((5 / body.length) * 100));
  });

  it("merges overlapping spans before counting", () => {
    const body = "abcdefghij";
    const percent = translationCoveragePercent(body, [
      {
        id: "1",
        sourceText: "a",
        translatedText: "ab",
        spans: [{ start: 0, end: 2 }],
      },
      {
        id: "2",
        sourceText: "b",
        translatedText: "bc",
        spans: [{ start: 1, end: 3 }],
      },
    ]);
    expect(percent).toBe(30);
  });

  it("ignores spans that no longer match the body", () => {
    const body = "Hello";
    const percent = translationCoveragePercent(body, [
      {
        id: "1",
        sourceText: "Hi",
        translatedText: "Bonjour",
        spans: [{ start: 0, end: 5 }],
      },
    ]);
    expect(percent).toBe(0);
  });
});
