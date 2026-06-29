import { describe, expect, it } from "vitest";

import { resolveFinishedEntryTranslations } from "@/lib/entries/finish-translations";

describe("resolveFinishedEntryTranslations", () => {
  it("keeps saved entry translations when finish snapshot only has optimistic ids", () => {
    const saved = [
      {
        id: "t1",
        sourceText: "hello",
        translatedText: "bonjour",
      },
    ];

    expect(
      resolveFinishedEntryTranslations(saved, [
        {
          id: "opt-123",
          sourceText: "hello",
          translatedText: "bonjour",
        },
      ]),
    ).toEqual(saved);
  });

  it("uses persisted translations from the finish snapshot when present", () => {
    expect(
      resolveFinishedEntryTranslations([], [
        {
          id: "t2",
          sourceText: "cat",
          translatedText: "chat",
        },
      ]),
    ).toEqual([
      {
        id: "t2",
        sourceText: "cat",
        translatedText: "chat",
      },
    ]);
  });

  it("merges persisted translations from DB and finish snapshot", () => {
    expect(
      resolveFinishedEntryTranslations(
        [
          {
            id: "t1",
            sourceText: "hello",
            translatedText: "bonjour",
          },
        ],
        [
          {
            id: "t2",
            sourceText: "cat",
            translatedText: "chat",
          },
        ],
      ),
    ).toEqual([
      {
        id: "t1",
        sourceText: "hello",
        translatedText: "bonjour",
      },
      {
        id: "t2",
        sourceText: "cat",
        translatedText: "chat",
      },
    ]);
  });
});
