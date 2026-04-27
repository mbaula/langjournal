import { describe, expect, it } from "vitest";

import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";

describe("FALLBACK_LANGUAGES", () => {
  it("contains common expected language codes", () => {
    const codes = new Set(FALLBACK_LANGUAGES.map((l) => l.code));
    expect(codes.has("en")).toBe(true);
    expect(codes.has("es")).toBe(true);
    expect(codes.has("fr")).toBe(true);
    expect(codes.has("ja")).toBe(true);
  });

  it("is sorted by name for predictable dropdown UX", () => {
    const names = FALLBACK_LANGUAGES.map((l) => l.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "en"));
    expect(names).toEqual(sorted);
  });
});
