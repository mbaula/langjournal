import { describe, expect, it } from "vitest";

import {
  buildLearningLanguageCodes,
  orderLearningLanguageOptions,
} from "@/lib/languages/learning-language-options";

describe("buildLearningLanguageCodes", () => {
  it("returns onboarding languages in order when target is included", () => {
    expect(
      buildLearningLanguageCodes(
        [
          { languageCode: "fr", level: "intermediate" },
          { languageCode: "es", level: "beginner" },
        ],
        "fr",
      ),
    ).toEqual(["fr", "es"]);
  });

  it("prepends active target when missing from onboarding list", () => {
    expect(
      buildLearningLanguageCodes(
        [{ languageCode: "fr", level: "intermediate" }],
        "de",
      ),
    ).toEqual(["de", "fr"]);
  });
});

describe("orderLearningLanguageOptions", () => {
  it("maps codes to catalog labels with locale fallback", () => {
    const options = orderLearningLanguageOptions(
      [{ languageCode: "fr", level: "intermediate" }],
      "fr",
      [{ code: "fr", name: "French" }],
      "en",
    );

    expect(options).toEqual([{ code: "fr", name: "French" }]);
  });
});
