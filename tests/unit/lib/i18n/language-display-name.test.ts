import { describe, expect, it } from "vitest";

import { getLocalizedLanguageDisplayName } from "@/lib/i18n/language-display-name";

describe("getLocalizedLanguageDisplayName", () => {
  it("localizes common language codes via Intl", () => {
    expect(getLocalizedLanguageDisplayName("fr", "en")).toBe("French");
    expect(getLocalizedLanguageDisplayName("fr", "vi")).toBe("Tiếng Pháp");
  });

  it("uses the catalog for rare codes instead of environment-specific Intl", () => {
    const catalog = [{ code: "btx", name: "Batak Karo" }];
    expect(getLocalizedLanguageDisplayName("btx", "en", catalog)).toBe(
      "Batak Karo",
    );
    expect(getLocalizedLanguageDisplayName("btx", "vi", catalog)).toBe(
      "Batak Karo",
    );
  });

  it("still localizes common codes via Intl when a catalog is present", () => {
    const catalog = [{ code: "fr", name: "French" }];
    expect(getLocalizedLanguageDisplayName("fr", "vi", catalog)).toBe(
      "Tiếng Pháp",
    );
  });

  it("returns the code for rare languages when no catalog is available", () => {
    // Do not use Intl here — Node/browser ICU disagree and break hydration.
    expect(getLocalizedLanguageDisplayName("btx", "en")).toBe("btx");
  });
});
