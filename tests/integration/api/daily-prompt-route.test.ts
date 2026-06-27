import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedAppUser: vi.fn(),
  getAuthenticatedUserId: vi.fn(),
  getDailyPromptForEntry: vi.fn(),
  skipDailyPrompt: vi.fn(),
  recordPromptFeedback: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
  getAuthenticatedUserId: mocks.getAuthenticatedUserId,
}));

vi.mock("@/lib/prompts/daily-prompt", () => ({
  getDailyPromptForEntry: mocks.getDailyPromptForEntry,
  skipDailyPrompt: mocks.skipDailyPrompt,
  recordPromptFeedback: mocks.recordPromptFeedback,
}));

import { GET, POST } from "@/app/api/entries/[id]/daily-prompt/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

const sampleTarget = { level: "A1", index: 1 };

const samplePrompt = {
  text: "Describe your room",
  level: "A1",
  index: 1,
  canVoteTooEasy: true,
  canVoteTooHard: false,
  tooEasyStreak: 0,
  tooHardStreak: 0,
};

describe("api/entries/[id]/daily-prompt route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const res = await GET(new Request("http://localhost"), ctx("e1"));
    expect(res.status).toBe(401);
  });

  it("GET returns prompt when found", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.getDailyPromptForEntry.mockResolvedValueOnce(samplePrompt);

    const res = await GET(new Request("http://localhost"), ctx("e1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ prompt: samplePrompt });
  });

  it("POST skip returns updated prompt", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValueOnce("u1");
    mocks.skipDailyPrompt.mockResolvedValueOnce(samplePrompt);

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ action: "skip", target: sampleTarget }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req, ctx("e1"));
    expect(res.status).toBe(200);
    expect(mocks.skipDailyPrompt).toHaveBeenCalledWith("u1", "e1", sampleTarget);
    await expect(res.json()).resolves.toEqual({ prompt: samplePrompt });
  });

  it("POST feedback validates body", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValueOnce("u1");

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ action: "feedback" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req, ctx("e1"));
    expect(res.status).toBe(400);
  });
});
