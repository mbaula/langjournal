import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedAppUser: vi.fn(),
  getOnboardingState: vi.fn(),
  updateOnboardingProfile: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
}));

vi.mock("@/lib/db/onboarding", () => ({
  getOnboardingState: mocks.getOnboardingState,
  updateOnboardingProfile: mocks.updateOnboardingProfile,
}));

import { GET, PATCH } from "@/app/api/settings/profile/route";

describe("api/settings/profile route", () => {
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
      languages: [{ languageCode: "ja", level: "intermediate" }],
      isComplete: true,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      displayName: "Mark",
      ageRange: "25_34",
      languages: [{ languageCode: "ja", level: "intermediate" }],
      isComplete: true,
    });
  });

  it("PATCH returns 400 on invalid JSON", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: "{",
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("PATCH returns 400 on invalid payload", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({
        displayName: "Bad!",
        languages: [{ languageCode: "ja", level: "intermediate" }],
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("PATCH clears display name when empty", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.updateOnboardingProfile.mockResolvedValueOnce(undefined);
    mocks.getOnboardingState.mockResolvedValueOnce({
      displayName: null,
      ageRange: null,
      languages: [{ languageCode: "ja", level: "beginner" }],
      isComplete: true,
    });

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({
        displayName: "",
        languages: [{ languageCode: "ja", level: "beginner" }],
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req);

    expect(mocks.updateOnboardingProfile).toHaveBeenCalledWith("u1", {
      displayName: null,
      ageRange: null,
      languages: [{ languageCode: "ja", level: "beginner" }],
    });
    expect(res.status).toBe(200);
  });

  it("PATCH updates profile and returns state", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.updateOnboardingProfile.mockResolvedValueOnce(undefined);
    mocks.getOnboardingState.mockResolvedValueOnce({
      displayName: "Linh",
      ageRange: "18_24",
      languages: [
        { languageCode: "ja", level: "intermediate" },
        { languageCode: "es", level: "beginner" },
      ],
      isComplete: true,
    });

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({
        displayName: "  Linh  ",
        ageRange: "18_24",
        languages: [
          { languageCode: "ja", level: "intermediate" },
          { languageCode: "es", level: "beginner" },
        ],
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req);

    expect(mocks.updateOnboardingProfile).toHaveBeenCalledWith("u1", {
      displayName: "Linh",
      ageRange: "18_24",
      languages: [
        { languageCode: "ja", level: "intermediate" },
        { languageCode: "es", level: "beginner" },
      ],
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      displayName: "Linh",
      ageRange: "18_24",
      languages: [
        { languageCode: "ja", level: "intermediate" },
        { languageCode: "es", level: "beginner" },
      ],
      isComplete: true,
    });
  });
});
