import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedAppUser: vi.fn(),
  getSupportedLanguages: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
}));

vi.mock("@/lib/languages/supported-languages", () => ({
  getSupportedLanguages: mocks.getSupportedLanguages,
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

  it("returns supported languages from the shared loader", async () => {
    const languages = [{ code: "en", name: "English" }];
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.getSupportedLanguages.mockResolvedValueOnce(languages);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ languages });
  });

  it("can return the static fallback list", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.getSupportedLanguages.mockResolvedValueOnce(FALLBACK_LANGUAGES);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ languages: FALLBACK_LANGUAGES });
  });
});
