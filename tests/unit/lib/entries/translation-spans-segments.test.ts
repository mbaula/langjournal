import { describe, expect, it } from "vitest";

import { segmentTranslatedLineBySpans } from "@/lib/entries/entry-body-segments";
import type { InlineTranslation } from "@/lib/entries/translate";

const t = (
  id: string,
  translatedText: string,
  spans: InlineTranslation["spans"],
  sourceText = "src",
): InlineTranslation => ({
  id,
  sourceText,
  translatedText,
  spans,
});

describe("segmentTranslatedLineBySpans", () => {
  it("does not highlight matching text without stored spans", () => {
    expect(
      segmentTranslatedLineBySpans("des hôtels partout", 0, [
        t("1", "hôtels", undefined),
      ]),
    ).toEqual([{ text: "des hôtels partout" }]);
  });

  it("highlights only at stored span positions", () => {
    const translation = t("1", "hôtels", [{ start: 4, end: 10 }]);
    expect(
      segmentTranslatedLineBySpans("des hôtels et hôtels", 0, [translation]),
    ).toEqual([
      { text: "des " },
      { text: "hôtels", translation },
      { text: " et hôtels" },
    ]);
  });
});
