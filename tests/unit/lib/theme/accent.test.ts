import { describe, expect, it, vi } from "vitest";

import {
  accentLabel,
  isAccentId,
  normalizeAccentId,
  readStoredAccent,
} from "@/lib/theme/accent";

describe("accent helpers", () => {
  it("capitalizes accent labels", () => {
    expect(accentLabel("teal")).toBe("Teal");
  });

  it("recognizes valid accent ids", () => {
    expect(isAccentId("blue")).toBe(true);
    expect(isAccentId("invalid")).toBe(false);
    expect(isAccentId(null)).toBe(false);
  });

  it("maps legacy ids and falls back to gray", () => {
    expect(normalizeAccentId("sage")).toBe("green");
    expect(normalizeAccentId("not-real")).toBe("gray");
    expect(normalizeAccentId(null)).toBe("gray");
  });
});

describe("readStoredAccent", () => {
  it("returns gray on the server", () => {
    expect(readStoredAccent()).toBe("gray");
  });

  it("reads and normalizes localStorage on the client", () => {
    const getItem = vi.fn().mockReturnValue("sage");
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", { getItem });

    expect(readStoredAccent()).toBe("green");
    expect(getItem).toHaveBeenCalledWith("accent");

    vi.unstubAllGlobals();
  });
});
