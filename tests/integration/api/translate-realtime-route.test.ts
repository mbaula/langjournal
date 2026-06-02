import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedAppUser: vi.fn(),
  resolveRealtimeTranslation: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
}));

vi.mock("@/lib/translate/realtime", () => ({
  resolveRealtimeTranslation: mocks.resolveRealtimeTranslation,
}));

import { POST } from "@/app/api/translate/realtime/route";

describe("api/translate/realtime route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const req = new Request("http://localhost", { method: "POST", body: "{}" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("POST returns 400 on invalid body", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ text: "", source: "en", target: "es" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns translated text without DB access", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.resolveRealtimeTranslation.mockResolvedValueOnce({
      ok: true,
      sourceText: "hello",
      translatedText: "hola",
      fromServerMemory: false,
    });

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ text: "hello", source: "en", target: "es" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      sourceText: "hello",
      translatedText: "hola",
    });
    expect(mocks.resolveRealtimeTranslation).toHaveBeenCalledWith(
      "hello",
      "en",
      "es",
    );
  });
});
