import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeHintPlacement } from "@/components/journal/slash-translate-hint";

describe("computeHintPlacement", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { innerWidth: 1200, innerHeight: 800 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("places the hint below the anchor by default", () => {
    const placement = computeHintPlacement(
      {
        top: 100,
        bottom: 120,
        left: 80,
        right: 140,
        width: 60,
        height: 20,
        x: 80,
        y: 100,
        toJSON: () => ({}),
      },
      180,
      28,
    );

    expect(placement).toEqual({ top: 124, left: 80 });
  });

  it("flips the hint above the anchor when there is not enough room below", () => {
    vi.stubGlobal("window", { innerWidth: 400, innerHeight: 140 });

    const placement = computeHintPlacement(
      {
        top: 100,
        bottom: 120,
        left: 80,
        right: 140,
        width: 60,
        height: 20,
        x: 80,
        y: 100,
        toJSON: () => ({}),
      },
      180,
      28,
    );

    expect(placement.top).toBe(68);
  });

  it("keeps the hint inside the viewport horizontally", () => {
    vi.stubGlobal("window", { innerWidth: 220, innerHeight: 800 });

    const placement = computeHintPlacement(
      {
        top: 100,
        bottom: 120,
        left: 160,
        right: 200,
        width: 40,
        height: 20,
        x: 160,
        y: 100,
        toJSON: () => ({}),
      },
      180,
      28,
    );

    expect(placement.left).toBe(24);
  });
});
