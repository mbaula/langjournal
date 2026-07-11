import { describe, expect, it } from "vitest";

import { bodySnippetForSidebar } from "@/lib/text/entry-sidebar-preview";

describe("bodySnippetForSidebar", () => {
  it("returns Empty entry for null, undefined, or blank body", () => {
    expect(bodySnippetForSidebar(null)).toBe("Empty entry");
    expect(bodySnippetForSidebar(undefined)).toBe("Empty entry");
    expect(bodySnippetForSidebar("")).toBe("Empty entry");
    expect(bodySnippetForSidebar("   \n\n   ")).toBe("Empty entry");
  });

  it("returns the full trimmed body", () => {
    expect(bodySnippetForSidebar("Hello world")).toBe("Hello world");
    expect(bodySnippetForSidebar("First line\nSecond line")).toBe(
      "First line\nSecond line",
    );
    expect(bodySnippetForSidebar("Line one\r\nLine two")).toBe(
      "Line one\nLine two",
    );
  });

  it("preserves long entries without truncation", () => {
    const longText =
      "This is a long journal entry that should remain fully visible in the sidebar label when there is no title.";
    expect(bodySnippetForSidebar(longText)).toBe(longText);
  });
});
