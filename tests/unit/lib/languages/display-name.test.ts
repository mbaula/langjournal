import { describe, expect, it } from "vitest";

import { getLanguageDisplayName } from "@/lib/languages/display-name";

describe("getLanguageDisplayName", () => {
  it("returns the fallback catalog name for a known code", () => {
    expect(getLanguageDisplayName("ja")).toBe("Japanese");
    expect(getLanguageDisplayName("es")).toBe("Spanish");
    expect(getLanguageDisplayName("tl")).toBe("Tagalog");
  });

  it("uses Intl for codes missing from the catalog", () => {
    expect(getLanguageDisplayName("mni")).toBe("Manipuri");
  });

  it("returns the code when unknown", () => {
    expect(getLanguageDisplayName("xx-unknown")).toBe("xx-unknown");
  });
});
