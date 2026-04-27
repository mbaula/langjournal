import { describe, expect, it } from "vitest";

import { patchLanguageProfileSchema } from "@/lib/validations/language-profile";

describe("patchLanguageProfileSchema", () => {
  it("accepts valid payloads with trimmed codes", () => {
    const parsed = patchLanguageProfileSchema.safeParse({
      nativeLanguage: " en ",
      targetLanguage: "es",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.nativeLanguage).toBe("en");
      expect(parsed.data.targetLanguage).toBe("es");
    }
  });

  it("rejects same native and target language", () => {
    const parsed = patchLanguageProfileSchema.safeParse({
      nativeLanguage: "en",
      targetLanguage: "en",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid language code characters", () => {
    const parsed = patchLanguageProfileSchema.safeParse({
      nativeLanguage: "en",
      targetLanguage: "es!",
    });
    expect(parsed.success).toBe(false);
  });
});
