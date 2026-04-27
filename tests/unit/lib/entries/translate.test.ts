import { beforeEach, describe, expect, it, vi } from "vitest";

const { translatePlainTextMock, memoryCacheGetMock, memoryCacheSetMock } =
  vi.hoisted(() => ({
    translatePlainTextMock: vi.fn(),
    memoryCacheGetMock: vi.fn(),
    memoryCacheSetMock: vi.fn(),
  }));

vi.mock("@/lib/translate/google", () => ({
  translatePlainText: translatePlainTextMock,
}));

vi.mock("@/lib/translate/memory-cache", () => ({
  memoryCacheGet: memoryCacheGetMock,
  memoryCacheSet: memoryCacheSetMock,
}));

import {
  removeTranslation,
  resolveTranslationText,
  type InlineTranslation,
} from "@/lib/entries/translate";

describe("resolveTranslationText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty text", async () => {
    const result = await resolveTranslationText("   ", [], "en", "ja");
    expect(result).toEqual({ ok: false, error: "Nothing to translate" });
  });

  it("rejects text over max length", async () => {
    const tooLong = "a".repeat(3001);
    const result = await resolveTranslationText(tooLong, [], "en", "ja");
    expect(result).toEqual({ ok: false, error: "Text too long (max 3 000 chars)" });
  });

  it("returns existing translation when normalized source matches", async () => {
    const existing: InlineTranslation[] = [
      { id: "t1", sourceText: "hello   world", translatedText: "hola mundo" },
    ];

    const result = await resolveTranslationText(
      " hello world ",
      existing,
      "en",
      "es",
    );

    expect(result).toEqual({
      ok: true,
      sourceText: "hello   world",
      translatedText: "hola mundo",
      fromExisting: existing[0],
      fromServerMemory: false,
    });
    expect(memoryCacheGetMock).not.toHaveBeenCalled();
    expect(translatePlainTextMock).not.toHaveBeenCalled();
  });

  it("returns memory cache hit before translation API", async () => {
    memoryCacheGetMock.mockReturnValueOnce("bonjour");

    const result = await resolveTranslationText("hello", [], "en", "fr");

    expect(memoryCacheGetMock).toHaveBeenCalledOnce();
    expect(translatePlainTextMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      sourceText: "hello",
      translatedText: "bonjour",
      fromExisting: null,
      fromServerMemory: true,
    });
  });

  it("calls translation API and stores result in server memory cache", async () => {
    memoryCacheGetMock.mockReturnValueOnce(undefined);
    translatePlainTextMock.mockResolvedValueOnce("hola");

    const result = await resolveTranslationText(" hello ", [], "en", "es");

    expect(translatePlainTextMock).toHaveBeenCalledWith("hello", "en", "es");
    expect(memoryCacheSetMock).toHaveBeenCalledOnce();
    expect(result).toEqual({
      ok: true,
      sourceText: "hello",
      translatedText: "hola",
      fromExisting: null,
      fromServerMemory: false,
    });
  });

  it("returns translation error message when API throws", async () => {
    memoryCacheGetMock.mockReturnValueOnce(undefined);
    translatePlainTextMock.mockRejectedValueOnce(new Error("quota exceeded"));

    const result = await resolveTranslationText("hello", [], "en", "es");

    expect(result).toEqual({ ok: false, error: "quota exceeded" });
  });
});

describe("removeTranslation", () => {
  it("removes matching translation id", () => {
    const translations: InlineTranslation[] = [
      { id: "1", sourceText: "a", translatedText: "A" },
      { id: "2", sourceText: "b", translatedText: "B" },
    ];

    expect(removeTranslation(translations, "1")).toEqual([
      { id: "2", sourceText: "b", translatedText: "B" },
    ]);
  });
});
