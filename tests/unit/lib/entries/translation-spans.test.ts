import { describe, expect, it } from "vitest";

import type { InlineTranslation } from "@/lib/entries/translate";
import {
  adjustTranslationSpansForEdit,
  appendTranslationSpan,
  findTranslationAtIndex,
  pruneInvalidTranslationSpans,
} from "@/lib/entries/translation-spans";

const base: InlineTranslation = {
  id: "1",
  sourceText: "hotels",
  translatedText: "hôtels",
};

describe("appendTranslationSpan", () => {
  it("stores a span when body text matches translatedText", () => {
    const body = "des hôtels";
    expect(appendTranslationSpan(base, { start: 4, end: 10 }, body)).toEqual({
      ...base,
      spans: [{ start: 4, end: 10 }],
    });
  });
});

describe("adjustTranslationSpansForEdit", () => {
  it("drops spans touched by an edit", () => {
    const translations = [
      {
        ...base,
        spans: [{ start: 4, end: 10 }],
      },
    ];
    expect(adjustTranslationSpansForEdit(translations, 4, 6, 6)).toEqual([
      base,
    ]);
  });

  it("shifts spans after an insertion", () => {
    const translations = [
      {
        ...base,
        spans: [{ start: 10, end: 16 }],
      },
    ];
    expect(adjustTranslationSpansForEdit(translations, 0, 0, 2)).toEqual([
      {
        ...base,
        spans: [{ start: 12, end: 18 }],
      },
    ]);
  });
});

describe("findTranslationAtIndex", () => {
  it("returns the translation covering a character index", () => {
    const translations = [
      {
        ...base,
        spans: [{ start: 4, end: 10 }],
      },
    ];
    expect(findTranslationAtIndex(translations, 3)).toBeNull();
    expect(findTranslationAtIndex(translations, 4)).toEqual(translations[0]);
    expect(findTranslationAtIndex(translations, 9)).toEqual(translations[0]);
    expect(findTranslationAtIndex(translations, 10)).toBeNull();
  });
});

describe("pruneInvalidTranslationSpans", () => {
  it("removes spans that no longer match the body", () => {
    const translations = [
      {
        ...base,
        spans: [{ start: 0, end: 6 }],
      },
    ];
    expect(pruneInvalidTranslationSpans("hôtels", translations)).toEqual([
      {
        ...base,
        spans: [{ start: 0, end: 6 }],
      },
    ]);
    expect(pruneInvalidTranslationSpans("hotels", translations)).toEqual([base]);
  });
});
