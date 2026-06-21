import { CefrLevel } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  bumpCefrLevel,
  canBumpCefrLevel,
  canLowerCefrLevel,
  lowerCefrLevel,
} from "@/lib/prompts/cefr";
import {
  FEEDBACK_STREAK_THRESHOLD,
  markPromptSeen,
  pickRandomUnseenIndex,
} from "@/lib/prompts/daily-prompt";
import { getPromptCount, PROMPTS_BY_LEVEL } from "@/lib/prompts/prompts";

describe("prompts data", () => {
  it("has the expected prompt counts per CEFR level", () => {
    expect(getPromptCount("A1")).toBe(50);
    expect(getPromptCount("A2")).toBe(50);
    expect(getPromptCount("B1")).toBe(50);
    expect(getPromptCount("B2")).toBe(50);
    expect(getPromptCount("C1")).toBe(35);
    expect(getPromptCount("C2")).toBe(30);
  });

  it("has no empty prompt lists", () => {
    for (const level of Object.keys(PROMPTS_BY_LEVEL)) {
      expect(getPromptCount(level as keyof typeof PROMPTS_BY_LEVEL)).toBeGreaterThan(0);
    }
  });
});

describe("prompt feedback threshold", () => {
  it("requires five consecutive votes to change level", () => {
    expect(FEEDBACK_STREAK_THRESHOLD).toBe(5);
  });
});

describe("pickRandomUnseenIndex", () => {
  it("returns an unseen index when some remain", () => {
    const seen = [0, 1, 2];
    const { index, resetSeen } = pickRandomUnseenIndex("A1", seen);
    expect(seen).not.toContain(index);
    expect(resetSeen).toBe(false);
  });

  it("never returns the excluded index when another option exists", () => {
    const { index } = pickRandomUnseenIndex("A1", [], 4);
    expect(index).not.toBe(4);
  });

  it("picks a different index when the current prompt is excluded", () => {
    const seen = Array.from({ length: 50 }, (_, i) => i);
    const { index } = pickRandomUnseenIndex("A1", seen, 12);
    expect(index).not.toBe(12);
  });
});

describe("markPromptSeen", () => {
  it("appends to the seen list for a level", () => {
    const next = markPromptSeen({}, "B1", 3, false);
    expect(next.B1).toEqual([3]);
  });

  it("resets the level list when the full cycle completes", () => {
    const seen = { B1: Array.from({ length: 49 }, (_, i) => i) };
    const next = markPromptSeen(seen, "B1", 49, false);
    expect(next.B1).toEqual([49]);
  });

  it("starts a fresh cycle when resetSeen is true", () => {
    const seen = { A2: [0, 1, 2, 3, 4] };
    const next = markPromptSeen(seen, "A2", 7, true);
    expect(next.A2).toEqual([7]);
  });
});

describe("CEFR level adjustments", () => {
  it("bumps and lowers within bounds", () => {
    expect(bumpCefrLevel(CefrLevel.B1)).toBe(CefrLevel.B2);
    expect(lowerCefrLevel(CefrLevel.B1)).toBe(CefrLevel.A2);
    expect(bumpCefrLevel(CefrLevel.C2)).toBe(CefrLevel.C2);
    expect(lowerCefrLevel(CefrLevel.A1)).toBe(CefrLevel.A1);
  });

  it("reports when bump/lower is allowed", () => {
    expect(canBumpCefrLevel(CefrLevel.C2)).toBe(false);
    expect(canLowerCefrLevel(CefrLevel.A1)).toBe(false);
    expect(canBumpCefrLevel(CefrLevel.A1)).toBe(true);
    expect(canLowerCefrLevel(CefrLevel.C2)).toBe(true);
  });
});
