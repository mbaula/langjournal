import { describe, expect, it } from "vitest";

import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";
import { parseEntryDate } from "@/lib/validations/entry";
import { patchLanguageProfileSchema } from "@/lib/validations/language-profile";
import { onboardingPayloadSchema } from "@/lib/validations/onboarding";

describe("coverage: validations + languages", () => {
  it("fallback languages are sorted and contain common codes", () => {
    expect(FALLBACK_LANGUAGES.length).toBeGreaterThan(10);
    const names = FALLBACK_LANGUAGES.map((l) => l.name);
    expect([...names].sort((a, b) => a.localeCompare(b, "en"))).toEqual(names);
    expect(FALLBACK_LANGUAGES.some((l) => l.code === "en")).toBe(true);
  });

  it("mergeProfileCodes preserves and injects missing codes", () => {
    const merged = mergeProfileCodes([{ code: "en", name: "English" }], "xx", "en");
    expect(merged.some((l) => l.code === "xx")).toBe(true);
    expect(merged.some((l) => l.code === "en")).toBe(true);
  });

  it("parseEntryDate returns UTC date for YYYY-MM-DD", () => {
    const d = parseEntryDate("2026-05-08");
    expect(d.toISOString().slice(0, 10)).toBe("2026-05-08");
    // null/undefined falls back to 'now' (just check it's a Date)
    expect(parseEntryDate(null)).toBeInstanceOf(Date);
  });

  it("language profile validation requires different native/target", () => {
    const ok = patchLanguageProfileSchema.safeParse({
      nativeLanguage: "en",
      targetLanguage: "es",
    });
    expect(ok.success).toBe(true);

    const bad = patchLanguageProfileSchema.safeParse({
      nativeLanguage: "en",
      targetLanguage: "en",
    });
    expect(bad.success).toBe(false);
  });

  it("onboarding payload validation accepts expected structure", () => {
    const res = onboardingPayloadSchema.safeParse({
      displayName: "Mark",
      ageRange: "25_34",
      languages: [{ languageCode: "es", level: "beginner" }],
    });
    expect(res.success).toBe(true);
  });
});

