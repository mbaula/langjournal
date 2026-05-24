import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.findUnique },
  },
}));

import { getOnboardingState } from "@/lib/db/onboarding";

describe("getOnboardingState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isComplete is false when onboardingCompletedAt is set but no languages", async () => {
    mocks.findUnique.mockResolvedValueOnce({
      displayName: "Linh",
      ageRange: null,
      onboardingCompletedAt: new Date("2026-05-01"),
      learningLanguages: [],
    });

    const state = await getOnboardingState("user-1");

    expect(state.isComplete).toBe(false);
    expect(state.languages).toEqual([]);
  });

  it("isComplete is true only when timestamp and languages exist", async () => {
    mocks.findUnique.mockResolvedValueOnce({
      displayName: "Linh",
      ageRange: "25_34",
      onboardingCompletedAt: new Date("2026-05-01"),
      learningLanguages: [{ languageCode: "fr", level: "intermediate" }],
    });

    const state = await getOnboardingState("user-1");

    expect(state.isComplete).toBe(true);
    expect(state.languages).toEqual([
      { languageCode: "fr", level: "intermediate" },
    ]);
  });
});
