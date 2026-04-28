import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedAppUser: vi.fn(),
  getLanguageProfile: vi.fn(),
  updateLanguageProfile: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
}));

vi.mock("@/lib/db/language", () => ({
  getLanguageProfile: mocks.getLanguageProfile,
  updateLanguageProfile: mocks.updateLanguageProfile,
}));

import { GET, PATCH } from "@/app/api/settings/language-profile/route";

describe("api/settings/language-profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns 404 when profile missing", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.getLanguageProfile.mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("GET returns profile when found", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.getLanguageProfile.mockResolvedValueOnce({
      nativeLanguage: "en",
      targetLanguage: "ja",
      uiLocale: "en",
    });

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      nativeLanguage: "en",
      targetLanguage: "ja",
      uiLocale: "en",
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
      body: JSON.stringify({ nativeLanguage: "en", targetLanguage: "en" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("PATCH returns 500 when update throws", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.updateLanguageProfile.mockRejectedValueOnce(new Error("db error"));

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ nativeLanguage: "en", targetLanguage: "es" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(500);
  });

  it("PATCH returns updated profile on success", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.updateLanguageProfile.mockResolvedValueOnce(undefined);
    mocks.getLanguageProfile.mockResolvedValueOnce({
      nativeLanguage: "en",
      targetLanguage: "es",
      uiLocale: "en",
    });

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ nativeLanguage: "en", targetLanguage: "es" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req);

    expect(mocks.updateLanguageProfile).toHaveBeenCalledWith("u1", {
      nativeLanguage: "en",
      targetLanguage: "es",
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      nativeLanguage: "en",
      targetLanguage: "es",
      uiLocale: "en",
    });
  });
});
