import { describe, expect, it } from "vitest";

import {
  buildPastEntryLanguageTabs,
  entryMatchesLanguageTab,
  filterEntriesByLanguageTab,
} from "@/lib/languages/past-entries-language-tabs";

describe("past entries language tabs", () => {
  const entries = [
    {
      id: "1",
      title: "French one",
      targetLanguage: "fr",
      entryDate: "2026-01-01",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      body: "bonjour",
      translations: [],
    },
    {
      id: "2",
      title: "Spanish one",
      targetLanguage: "es",
      entryDate: "2026-01-02",
      createdAt: "2026-01-02",
      updatedAt: "2026-01-02",
      body: "hola",
      translations: [],
    },
  ];

  it("matches entries by target language", () => {
    expect(entryMatchesLanguageTab(entries[0]!, "fr")).toBe(true);
    expect(entryMatchesLanguageTab(entries[0]!, "es")).toBe(false);
    expect(entryMatchesLanguageTab({ targetLanguage: null }, "fr")).toBe(false);
  });

  it("filters entries for a language tab", () => {
    expect(filterEntriesByLanguageTab(entries, "fr")).toHaveLength(1);
    expect(filterEntriesByLanguageTab(entries, "fr")[0]?.id).toBe("1");
  });

  it("builds tabs from learning languages and entry languages", () => {
    const tabs = buildPastEntryLanguageTabs(
      entries,
      [
        { languageCode: "fr", level: "intermediate" },
        { languageCode: "es", level: "beginner" },
      ],
      "en",
    );

    expect(tabs.map((tab) => tab.code)).toEqual(["fr", "es"]);
    expect(tabs[0]?.count).toBe(1);
    expect(tabs[1]?.count).toBe(1);
  });
});
