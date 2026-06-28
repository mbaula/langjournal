import { describe, expect, it } from "vitest";

import {
  buildSmoothLinePath,
  buildTranslationProgressChartPoints,
  getTranslationProgressChartLayout,
  pickXTickIndexes,
} from "@/lib/journal/translation-progress-chart";

const sampleEntry = {
  id: "a",
  entryDate: "2026-06-01",
  title: "One",
  translationPercent: 10,
  dateLabel: "Jun 1",
  tooltipLabel: "Jun 1 · One",
  tooltipText: "Jun 1 · One — 10% translated",
};

describe("buildSmoothLinePath", () => {
  it("returns a move command for one point", () => {
    expect(buildSmoothLinePath([{ x: 10, y: 20 }])).toBe("M 10 20");
  });

  it("returns a smooth cubic path for multiple points", () => {
    const path = buildSmoothLinePath([
      { x: 0, y: 100 },
      { x: 50, y: 50 },
      { x: 100, y: 0 },
    ]);

    expect(path.startsWith("M 0 100")).toBe(true);
    expect(path.includes("C")).toBe(true);
    expect(path.endsWith("100 0")).toBe(true);
  });

  it("draws straight segments along the baseline between zero points", () => {
    const path = buildSmoothLinePath(
      [
        { x: 0, y: 150 },
        { x: 50, y: 150 },
        { x: 100, y: 80 },
      ],
      150,
    );

    expect(path).toContain("L 50 150");
    expect(path).not.toContain("C 50 150");
  });
});

describe("buildTranslationProgressChartPoints", () => {
  it("assigns entry numbers and hover labels in order", () => {
    const points = buildTranslationProgressChartPoints(
      [
        sampleEntry,
        {
          ...sampleEntry,
          id: "b",
          entryDate: "2026-06-02",
          title: "Two",
          translationPercent: 40,
          dateLabel: "Jun 2",
          tooltipLabel: "Jun 2 · Two",
          tooltipText: "Jun 2 · Two — 40% translated",
        },
      ],
      640,
    );

    expect(points[0]?.entryNumber).toBe(1);
    expect(points[1]?.entryNumber).toBe(2);
    expect(points[1]?.hoverLabel).toBe("Entry 2 · 40%");
  });

  it("maps entry order to x and percent to y", () => {
    const points = buildTranslationProgressChartPoints(
      [
        { ...sampleEntry, translationPercent: 0 },
        {
          ...sampleEntry,
          id: "b",
          translationPercent: 100,
        },
      ],
      640,
    );

    expect(points[0]!.x).toBeLessThan(points[1]!.x);
    expect(points[0]!.y).toBeGreaterThan(points[1]!.y);
  });
});

describe("pickXTickIndexes", () => {
  it("returns every index when entry count is small", () => {
    expect(pickXTickIndexes(18, 640)).toEqual(
      Array.from({ length: 18 }, (_, i) => i),
    );
  });

  it("thins labels when plot width is narrow", () => {
    expect(pickXTickIndexes(18, 200).length).toBeLessThan(18);
  });
});

describe("getTranslationProgressChartLayout", () => {
  it("uses the provided chart width for the plot area", () => {
    const narrow = getTranslationProgressChartLayout(18, 400);
    const wide = getTranslationProgressChartLayout(18, 800);

    expect(wide.plotWidth).toBeGreaterThan(narrow.plotWidth);
    expect(wide.width).toBe(800);
  });
});
