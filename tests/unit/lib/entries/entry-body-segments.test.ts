import { describe, expect, it } from "vitest";

import { segmentTranslatedLine } from "@/lib/entries/entry-body-segments";
import type { InlineTranslation } from "@/lib/entries/translate";

const t = (
  id: string,
  translatedText: string,
  sourceText = "src",
): InlineTranslation => ({
  id,
  sourceText,
  translatedText,
});

describe("segmentTranslatedLine", () => {
  it("returns a single span when there are no translations", () => {
    expect(segmentTranslatedLine("hello", [])).toEqual([{ text: "hello" }]);
  });

  it("returns non-breaking space when line is empty and there are no translations", () => {
    expect(segmentTranslatedLine("", [])).toEqual([{ text: "\u00A0" }]);
  });

  it("returns non-breaking space when line is empty even if translations exist", () => {
    expect(segmentTranslatedLine("", [t("1", "x")])).toEqual([
      { text: "\u00A0" },
    ]);
  });

  it("matches longer translated fragments first", () => {
    const translations = [t("short", "ab"), t("long", "abcd")];
    const result = segmentTranslatedLine("xxabcdyy", translations);
    expect(result).toEqual([
      { text: "xx" },
      { text: "abcd", translation: t("long", "abcd") },
      { text: "yy" },
    ]);
  });

  it("wraps matched text with its translation metadata", () => {
    const tr = t("1", "你好");
    expect(segmentTranslatedLine("prefix你好suffix", [tr])).toEqual([
      { text: "prefix" },
      { text: "你好", translation: tr },
      { text: "suffix" },
    ]);
  });

  it("applies multiple translations across one line", () => {
    const a = t("a", "foo");
    const b = t("b", "bar");
    expect(segmentTranslatedLine("foobar", [a, b])).toEqual([
      { text: "foo", translation: a },
      { text: "bar", translation: b },
    ]);
  });
});
