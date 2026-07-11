import { describe, expect, it } from "vitest";

import { resolveEntryLanguagePair } from "@/lib/entries/entry-language";

describe("resolveEntryLanguagePair", () => {
  it("prefers languages stored on the entry", () => {
    expect(
      resolveEntryLanguagePair(
        { sourceLanguage: "vi", targetLanguage: "es" },
        { source: "en", target: "fr" },
      ),
    ).toEqual({ source: "vi", target: "es" });
  });

  it("falls back to the profile pair when entry languages are missing", () => {
    expect(
      resolveEntryLanguagePair(
        { sourceLanguage: null, targetLanguage: null },
        { source: "en", target: "fr" },
      ),
    ).toEqual({ source: "en", target: "fr" });
  });
});
