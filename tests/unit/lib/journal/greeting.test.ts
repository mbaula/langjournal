import { describe, expect, it } from "vitest";

import {
  journalGreetingName,
  pickEncouragingSubtitle,
} from "@/lib/journal/greeting";

describe("journalGreetingName", () => {
  it("prefers display name", () => {
    expect(journalGreetingName("  Linh  ", "a@b.com")).toBe("Linh");
  });

  it("falls back to email local part", () => {
    expect(journalGreetingName(null, "linhvk@example.com")).toBe("Linhvk");
  });

  it("falls back to there when no name or email local", () => {
    expect(journalGreetingName("", "")).toBe("there");
  });
});

describe("pickEncouragingSubtitle", () => {
  it("returns a non-empty string", () => {
    expect(pickEncouragingSubtitle().length).toBeGreaterThan(10);
  });

  it("returns the same subtitle for the same UTC day", () => {
    const date = new Date("2026-06-27T12:00:00Z");
    expect(pickEncouragingSubtitle(date)).toBe(pickEncouragingSubtitle(date));
  });
});
