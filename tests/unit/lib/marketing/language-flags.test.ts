import { describe, expect, it } from "vitest";

import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";
import {
  LANGUAGE_CODE_TO_FLAG,
  LANGUAGES_WITHOUT_FLAG,
  SUPPORTED_LANGUAGE_FLAG_CODES,
} from "@/lib/marketing/language-flags";

describe("language flags", () => {
  it("maps every fallback language to a flag or an explicit skip", () => {
    for (const { code } of FALLBACK_LANGUAGES) {
      if (LANGUAGES_WITHOUT_FLAG.has(code)) {
        expect(LANGUAGE_CODE_TO_FLAG[code]).toBeUndefined();
        continue;
      }
      expect(LANGUAGE_CODE_TO_FLAG[code]).toMatch(/^[a-z]{2}(-[a-z]+)?$/);
    }
  });

  it("only includes flags derived from fallback languages", () => {
    const allowed = new Set(
      FALLBACK_LANGUAGES.map((l) => LANGUAGE_CODE_TO_FLAG[l.code]).filter(
        Boolean,
      ),
    );
    for (const flag of SUPPORTED_LANGUAGE_FLAG_CODES) {
      expect(allowed.has(flag)).toBe(true);
    }
    expect(SUPPORTED_LANGUAGE_FLAG_CODES.length).toBe(allowed.size);
  });
});
