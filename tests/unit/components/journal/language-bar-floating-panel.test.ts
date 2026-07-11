import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  computeHelpPopoverRect,
  computeLanguagePickerRect,
} from "@/components/journal/language-bar-floating-panel";

describe("language bar floating panel positioning", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      innerWidth: 1200,
      matchMedia: () => ({
        matches: false,
        media: "",
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("places the language picker below the trigger and aligned to its right edge", () => {
    const rect = computeLanguagePickerRect({
      top: 120,
      bottom: 160,
      left: 80,
      right: 260,
      width: 180,
      height: 40,
      x: 80,
      y: 120,
      toJSON: () => ({}),
    });

    expect(rect.top).toBe(168);
    expect(rect.left).toBe(16);
    expect(rect.width).toBe(320);
  });

  it("places the help popover to the right on desktop", () => {
    const rect = computeHelpPopoverRect({
      top: 120,
      bottom: 160,
      left: 900,
      right: 980,
      width: 80,
      height: 40,
      x: 900,
      y: 120,
      toJSON: () => ({}),
    });

    expect(rect.top).toBe(120);
    expect(rect.left).toBe(736);
  });
});
