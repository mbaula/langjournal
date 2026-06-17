import { describe, expect, it } from "vitest";

import { matchTranslationCapitalization } from "@/lib/text/translation-capitalization";

describe("matchTranslationCapitalization", () => {
  it("lowercases translated text when the source starts lowercase", () => {
    expect(matchTranslationCapitalization("hello", "Hola")).toBe("hola");
    expect(matchTranslationCapitalization("bonjour", "Hello")).toBe("hello");
  });

  it("capitalizes translated text when the source starts uppercase", () => {
    expect(matchTranslationCapitalization("Hello", "hola")).toBe("Hola");
    expect(matchTranslationCapitalization("Bonjour", "hello")).toBe("Hello");
  });

  it("skips leading whitespace when reading source case", () => {
    expect(matchTranslationCapitalization("  hello", "Hola")).toBe("hola");
  });

  it("leaves already matching capitalization unchanged", () => {
    expect(matchTranslationCapitalization("hello", "hola")).toBe("hola");
    expect(matchTranslationCapitalization("Hello", "Hola")).toBe("Hola");
  });
});
