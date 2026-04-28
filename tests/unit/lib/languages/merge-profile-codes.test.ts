import { describe, expect, it } from "vitest";

import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";

describe("mergeProfileCodes", () => {
  it("keeps existing entries and sorts by display name", () => {
    const list = [
      { code: "es", name: "Spanish" },
      { code: "en", name: "English" },
    ];

    const merged = mergeProfileCodes(list, "en", "es");
    expect(merged).toEqual([
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
    ]);
  });

  it("adds missing profile codes using code as display name", () => {
    const merged = mergeProfileCodes([{ code: "en", name: "English" }], "en", "ja");
    expect(merged).toContainEqual({ code: "ja", name: "ja" });
  });
});
