import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedAppUser: vi.fn(),
  getOnboardingState: vi.fn(),
  completeOnboarding: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
}));

vi.mock("@/lib/db/onboarding", () => ({
  getOnboardingState: mocks.getOnboardingState,
  completeOnboarding: mocks.completeOnboarding,
}));

import { GET, POST } from "@/app/api/onboarding/route";

describe("api/onboarding route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns onboarding state", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.getOnboardingState.mockResolvedValueOnce({
      displayName: "Mark",
      ageRange: "25_34",
      languages: [
        { languageCode: "ja", level: "intermediate" },
        { languageCode: "es", level: "beginner" },
      ],
      isComplete: true,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      displayName: "Mark",
      ageRange: "25_34",
      languages: [
        { languageCode: "ja", level: "intermediate" },
        { languageCode: "es", level: "beginner" },
      ],
      isComplete: true,
    });
  });

  it("POST accepts display names with special characters", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.completeOnboarding.mockResolvedValueOnce(undefined);
    mocks.getOnboardingState.mockResolvedValueOnce({
      displayName: "Bad!",
      ageRange: null,
      languages: [{ languageCode: "ja", level: "intermediate" }],
      isComplete: true,
    });

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "Bad!",
        languages: [{ languageCode: "ja", level: "intermediate" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("POST validates payload - requires at least one language", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "Mark",
        languages: [],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST saves onboarding with multiple languages", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.completeOnboarding.mockResolvedValueOnce(undefined);

    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "Mark",
        ageRange: "25_34",
        languages: [
          { languageCode: "ja", level: "intermediate" },
          { languageCode: "es", level: "beginner" },
        ],
      }),
    });
    const res = await POST(req);

    expect(mocks.completeOnboarding).toHaveBeenCalledWith("u1", {
      displayName: "Mark",
      ageRange: "25_34",
      languages: [
        { languageCode: "ja", level: "intermediate" },
        { languageCode: "es", level: "beginner" },
      ],
    });
    expect(res.status).toBe(200);
  });
});
