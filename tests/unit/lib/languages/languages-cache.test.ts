import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearCachedLanguages,
  fetchLanguagesCatalog,
  getCachedLanguages,
  setCachedLanguages,
} from "@/lib/languages/languages-cache";

describe("languages-cache", () => {
  afterEach(() => {
    clearCachedLanguages();
    vi.unstubAllGlobals();
  });

  it("returns cached languages without refetching", async () => {
    setCachedLanguages([{ code: "btx", name: "Batak Karo" }]);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchLanguagesCatalog();
    expect(result).toEqual([{ code: "btx", name: "Batak Karo" }]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getCachedLanguages()?.[0]?.name).toBe("Batak Karo");
  });

  it("fetches and caches languages when empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          languages: [{ code: "btx", name: "Batak Karo" }],
        }),
      }),
    );

    const result = await fetchLanguagesCatalog();
    expect(result).toEqual([{ code: "btx", name: "Batak Karo" }]);
    expect(getCachedLanguages()).toEqual([
      { code: "btx", name: "Batak Karo" },
    ]);
  });
});
