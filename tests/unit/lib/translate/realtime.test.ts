import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  translatePlainText: vi.fn(),
  memoryCacheGet: vi.fn(),
  memoryCacheSet: vi.fn(),
}));

vi.mock("@/lib/translate/google", () => ({
  translatePlainText: mocks.translatePlainText,
}));

vi.mock("@/lib/translate/memory-cache", () => ({
  memoryCacheGet: mocks.memoryCacheGet,
  memoryCacheSet: mocks.memoryCacheSet,
}));

import {
  clientTranslationMatchesServerCache,
  resolveRealtimeTranslation,
} from "@/lib/translate/realtime";

describe("resolveRealtimeTranslation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.memoryCacheGet.mockReturnValue(undefined);
  });

  it("returns cached translation from server memory", async () => {
    mocks.memoryCacheGet.mockReturnValueOnce("hola");
    const result = await resolveRealtimeTranslation("hello", "en", "es");
    expect(result).toEqual({
      ok: true,
      sourceText: "hello",
      translatedText: "hola",
      fromServerMemory: true,
    });
    expect(mocks.translatePlainText).not.toHaveBeenCalled();
  });

  it("calls Google on cache miss", async () => {
    mocks.translatePlainText.mockResolvedValueOnce("hola");
    const result = await resolveRealtimeTranslation("hello", "en", "es");
    expect(result).toEqual({
      ok: true,
      sourceText: "hello",
      translatedText: "hola",
      fromServerMemory: false,
    });
    expect(mocks.memoryCacheSet).toHaveBeenCalled();
  });
});

describe("clientTranslationMatchesServerCache", () => {
  it("returns true when cache matches client text", () => {
    mocks.memoryCacheGet.mockReturnValueOnce("hola");
    expect(
      clientTranslationMatchesServerCache("hello", "en", "es", "hola"),
    ).toBe(true);
  });
});
