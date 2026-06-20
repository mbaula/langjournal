import { describe, expect, it } from "vitest";

import {
  columnCountForContainerWidth,
  distributeRoundRobin,
} from "@/components/flashcards/flashcard-library-grid";

describe("columnCountForContainerWidth", () => {
  it("returns 1 column on narrow containers", () => {
    expect(columnCountForContainerWidth(320)).toBe(1);
    expect(columnCountForContainerWidth(447)).toBe(1);
  });

  it("returns 2 columns at sm widths", () => {
    expect(columnCountForContainerWidth(448)).toBe(2);
    expect(columnCountForContainerWidth(703)).toBe(2);
  });

  it("returns 3 columns at lg widths", () => {
    expect(columnCountForContainerWidth(704)).toBe(3);
    expect(columnCountForContainerWidth(1119)).toBe(3);
  });

  it("returns 4 columns on wide containers", () => {
    expect(columnCountForContainerWidth(1120)).toBe(4);
    expect(columnCountForContainerWidth(1200)).toBe(4);
  });
});

describe("distributeRoundRobin", () => {
  it("assigns items to columns by index modulo column count", () => {
    expect(distributeRoundRobin(["a", "b", "c", "d", "e"], 3)).toEqual([
      ["a", "d"],
      ["b", "e"],
      ["c"],
    ]);
  });

  it("returns empty columns when there are no items", () => {
    expect(distributeRoundRobin([], 2)).toEqual([[], []]);
  });
});
