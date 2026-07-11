import { describe, expect, it } from "vitest";

import {
  buildLanguageLabelMap,
  labelFromLanguageMap,
} from "@/lib/languages/language-label-map";

describe("language-label-map", () => {
  it("builds a lowercase code map and skips code-as-name placeholders", () => {
    expect(
      buildLanguageLabelMap([
        { code: "btx", name: "Batak Karo" },
        { code: "XX", name: "xx" },
        { code: "fr", name: "French" },
      ]),
    ).toEqual({
      btx: "Batak Karo",
      fr: "French",
    });
  });

  it("looks up labels case-insensitively and falls back to the code", () => {
    const map = { btx: "Batak Karo" };
    expect(labelFromLanguageMap("BTX", map)).toBe("Batak Karo");
    expect(labelFromLanguageMap("mni", map)).toBe("mni");
  });
});
