import { describe, expect, it } from "vitest";

import { countWords, wordCountLabel } from "@/lib/text/word-count";

describe("countWords", () => {
  it("returns 0 for empty or whitespace-only input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });

  it("counts words split by runs of whitespace", () => {
    expect(countWords("one two three")).toBe(3);
    expect(countWords("one   two\nthree\tfour")).toBe(4);
  });
});

describe("wordCountLabel", () => {
  it("returns singular for 1", () => {
    expect(wordCountLabel(1)).toBe("1 word");
  });

  it("returns plural for other values", () => {
    expect(wordCountLabel(0)).toBe("0 words");
    expect(wordCountLabel(2)).toBe("2 words");
  });
});
