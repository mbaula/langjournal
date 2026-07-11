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
      { fr: "French", es: "Spanish" },
    );

    expect(tabs.map((tab) => tab.code)).toEqual(["fr", "es"]);
    expect(tabs[0]?.label).toBe("French");
    expect(tabs[1]?.label).toBe("Spanish");
    expect(tabs[0]?.count).toBe(1);
    expect(tabs[1]?.count).toBe(1);
  });

  it("uses the server label map for rare language codes", () => {
    const tabs = buildPastEntryLanguageTabs(
      [
        {
          id: "3",
          title: "Batak",
          targetLanguage: "btx",
          entryDate: "2026-01-03",
          createdAt: "2026-01-03",
          updatedAt: "2026-01-03",
          body: "hello",
          translations: [],
        },
      ],
      [{ languageCode: "btx", level: "beginner" }],
      { btx: "Batak Karo" },
    );

    expect(tabs).toEqual([{ code: "btx", label: "Batak Karo", count: 1 }]);
  });

  it("falls back to the code when the label map has no entry", () => {
    const tabs = buildPastEntryLanguageTabs(
      [
        {
          id: "3",
          title: "Batak",
          targetLanguage: "btx",
          entryDate: "2026-01-03",
          createdAt: "2026-01-03",
          updatedAt: "2026-01-03",
          body: "hello",
          translations: [],
        },
      ],
      [{ languageCode: "btx", level: "beginner" }],
    );

    expect(tabs[0]?.label).toBe("btx");
  });
});
