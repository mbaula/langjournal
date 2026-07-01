import { describe, expect, it } from "vitest";

import { resolveLocale, resolveLocaleFromAcceptLanguage } from "@/lib/i18n/resolve-locale";
import {
  patchLanguageProfileSchema,
  patchUiLocaleSchema,
} from "@/lib/validations/language-profile";

describe("resolveLocale", () => {
  it("prefers authenticated profile locale", () => {
    expect(
      resolveLocale({
        isAuthenticated: true,
        profileLocale: "vi",
        cookieLocale: "es",
        acceptLanguage: "en-US,en;q=0.9",
      }),
    ).toBe("vi");
  });

  it("uses cookie when anonymous", () => {
    expect(
      resolveLocale({
        cookieLocale: "zh-CN",
        acceptLanguage: "en-US,en;q=0.9",
      }),
    ).toBe("zh-CN");
  });

  it("falls back to Accept-Language", () => {
    expect(
      resolveLocale({
        acceptLanguage: "es-MX,es;q=0.9,en;q=0.8",
      }),
    ).toBe("es");
  });

  it("defaults to English", () => {
    expect(resolveLocale({})).toBe("en");
  });
});

describe("resolveLocaleFromAcceptLanguage", () => {
  it("maps zh variants to zh-CN", () => {
    expect(resolveLocaleFromAcceptLanguage("zh-TW,zh;q=0.9")).toBe("zh-CN");
    expect(resolveLocaleFromAcceptLanguage("zh-Hans-CN,zh;q=0.9")).toBe(
      "zh-CN",
    );
  });
});

describe("patchUiLocaleSchema", () => {
  it("accepts supported locales", () => {
    const parsed = patchUiLocaleSchema.safeParse({ uiLocale: "vi" });
    expect(parsed.success).toBe(true);
  });

  it("rejects unsupported locales", () => {
    const parsed = patchUiLocaleSchema.safeParse({ uiLocale: "fr" });
    expect(parsed.success).toBe(false);
  });
});

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
