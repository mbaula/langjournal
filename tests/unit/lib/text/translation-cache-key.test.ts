import { describe, expect, it } from "vitest";

import {
  normalizeTranslationSource,
  translationMemoryCacheKey,
} from "@/lib/text/translation-cache-key";

describe("normalizeTranslationSource", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeTranslationSource("  hello   world \n ")).toBe("hello world");
  });

  it("normalizes smart quotes and ellipsis", () => {
    expect(normalizeTranslationSource("‘hi’ “there”…")).toBe("'hi' \"there\"...");
  });
});

describe("translationMemoryCacheKey", () => {
  it("lowercases language codes and uses normalized text", () => {
    const key = translationMemoryCacheKey("EN", "ES", "  hello   world ");
    expect(key).toBe("en\u0000es\u0000hello world");
  });
});
