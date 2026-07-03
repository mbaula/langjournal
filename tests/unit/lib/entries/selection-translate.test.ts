import { describe, expect, it } from "vitest";

import {
  parseSelectionForTranslation,
  tryApplySelectionTranslation,
} from "@/lib/entries/selection-translate";

describe("parseSelectionForTranslation", () => {
  it("returns null for collapsed selection", () => {
    expect(parseSelectionForTranslation("hello", 2, 2)).toBeNull();
  });

  it("parses multi-line selection", () => {
    const body = "intro\nline one\nline two\noutro";
    const start = body.indexOf("line one");
    const end = body.indexOf("outro");

    expect(parseSelectionForTranslation(body, start, end)).toEqual({
      start,
      end,
      selectedText: "line one\nline two\n",
      trimmed: "line one\nline two",
    });
  });

  it("rejects selections shorter than min length after trim", () => {
    expect(parseSelectionForTranslation("  a  ", 0, 5)).toBeNull();
  });
});

describe("tryApplySelectionTranslation", () => {
  it("replaces a multi-line selection", () => {
    const body = "Before\nline one\nline two\nAfter";
    const start = body.indexOf("line one");
    const end = body.indexOf("After");

    const result = tryApplySelectionTranslation(
      body,
      start,
      end,
      "line one line two",
      "ligne un\nligne deux",
    );

    expect(result).toEqual({
      next: "Before\nligne un\nligne deux\nAfter",
      cursor: start + "ligne un\nligne deux\n".length,
      appliedText: "ligne un\nligne deux\n",
    });
  });
});
