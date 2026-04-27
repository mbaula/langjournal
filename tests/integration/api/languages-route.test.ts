import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedAppUser: vi.fn(),
  listGoogleTranslationLanguages: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
}));

vi.mock("@/lib/translate/google", () => ({
  listGoogleTranslationLanguages: mocks.listGoogleTranslationLanguages,
}));

import { GET } from "@/app/api/languages/route";
import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";

describe("api/languages route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns Google languages when available", async () => {
    const languages = [{ code: "en", name: "English" }];
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.listGoogleTranslationLanguages.mockResolvedValueOnce(languages);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ languages });
  });

  it("falls back when Google languages are unavailable", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.listGoogleTranslationLanguages.mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ languages: FALLBACK_LANGUAGES });
  });
});
