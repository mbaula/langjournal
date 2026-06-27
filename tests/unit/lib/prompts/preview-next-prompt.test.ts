import { describe, expect, it } from "vitest";

import { previewNextPrompt } from "@/lib/prompts/prompt-core";
import type { DailyPromptState } from "@/lib/prompts/prompt-core";

const basePrompt: DailyPromptState = {
  text: "Introduce yourself",
  level: "B1",
  index: 0,
  canVoteTooEasy: true,
  canVoteTooHard: true,
  tooEasyStreak: 0,
  tooHardStreak: 0,
};

describe("previewNextPrompt", () => {
  it("returns a different prompt immediately for skip", () => {
    const next = previewNextPrompt(basePrompt);
    expect(next.index).not.toBe(basePrompt.index);
    expect(next.text).not.toBe(basePrompt.text);
    expect(next.level).toBe("B1");
  });

  it("moves up one level immediately when marked too easy", () => {
    const next = previewNextPrompt(basePrompt, "too_easy");
    expect(next.level).toBe("B2");
    expect(next.index).not.toBe(basePrompt.index);
  });

  it("moves down one level immediately when marked too hard", () => {
    const next = previewNextPrompt(basePrompt, "too_hard");
    expect(next.level).toBe("A2");
    expect(next.index).not.toBe(basePrompt.index);
  });
});
