import { describe, expect, it } from "vitest";

import {
  CONTRIBUTION_MONTHS_PER_PAGE,
  formatUtcMonthRangeLabel,
  getUtcMonthPageRange,
  maxMonthPageIndex,
  sliceContributionDaysForRange,
} from "@/lib/journal/contribution-range";

describe("getUtcMonthPageRange", () => {
  it("returns six inclusive calendar months for page 0", () => {
    const { start, end } = getUtcMonthPageRange(0, 6);
    expect(start.toISOString().slice(0, 10)).toBe("2025-12-01");
    expect(end.toISOString().slice(0, 10)).toBe("2026-05-31");
  });
});

describe("sliceContributionDaysForRange", () => {
  it("fills missing days with zero counts", () => {
    const sliced = sliceContributionDaysForRange(
      [{ date: "2026-05-01", count: 2 }],
      new Date("2026-05-01T00:00:00Z"),
      new Date("2026-05-03T00:00:00Z"),
    );
    expect(sliced).toHaveLength(3);
    expect(sliced[1]).toEqual({ date: "2026-05-02", count: 0 });
  });
});

describe("maxMonthPageIndex", () => {
  it("allows a second page for a full year of data", () => {
    const data = Array.from({ length: 365 }, (_, i) => {
      const d = new Date("2025-05-18T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      return { date: d.toISOString().slice(0, 10), count: 0 };
    });
    expect(maxMonthPageIndex(data, CONTRIBUTION_MONTHS_PER_PAGE)).toBeGreaterThanOrEqual(
      1,
    );
  });
});

describe("formatUtcMonthRangeLabel", () => {
  it("formats start and end months", () => {
    const label = formatUtcMonthRangeLabel(
      new Date("2025-12-01T00:00:00Z"),
      new Date("2026-05-31T00:00:00Z"),
    );
    expect(label).toMatch(/Dec 2025/);
    expect(label).toMatch(/May 2026/);
  });
});
