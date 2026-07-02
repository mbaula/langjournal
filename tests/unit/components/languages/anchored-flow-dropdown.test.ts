import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeDropdownPlacement } from "@/components/languages/anchored-flow-dropdown";

describe("computeDropdownPlacement", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      innerHeight: 800,
      innerWidth: 1200,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("places the menu directly below the anchor when there is room", () => {
    const anchor = {
      top: 100,
      bottom: 140,
      left: 200,
      width: 240,
    } as DOMRect;

    const placement = computeDropdownPlacement(anchor, 120, 240);

    expect(placement.top).toBe(148);
    expect(placement.left).toBe(200);
    expect(placement.minWidth).toBe(240);
  });

  it("places the menu directly above the anchor when below would overflow", () => {
    const anchor = {
      top: 700,
      bottom: 740,
      left: 200,
      width: 240,
    } as DOMRect;

    const placement = computeDropdownPlacement(anchor, 80, 240);

    expect(placement.top).toBe(612);
    expect(placement.left).toBe(200);
  });

  it("defaults below when the menu height is not measured yet", () => {
    const anchor = {
      top: 700,
      bottom: 740,
      left: 200,
      width: 240,
    } as DOMRect;

    const placement = computeDropdownPlacement(anchor, 0, 240);

    expect(placement.top).toBe(748);
  });

  it("keeps a single option snug above the anchor instead of using max height", () => {
    const anchor = {
      top: 700,
      bottom: 740,
      left: 200,
      width: 240,
    } as DOMRect;

    const placement = computeDropdownPlacement(anchor, 44, 240);

    expect(placement.top).toBe(648);
  });
});
