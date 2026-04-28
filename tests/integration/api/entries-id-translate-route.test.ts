import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  randomUUID: vi.fn(),
  getAuthenticatedAppUser: vi.fn(),
  languagePairFromProfile: vi.fn(),
  resolveTranslationText: vi.fn(),
  removeTranslation: vi.fn(),
  prisma: {
    journalEntry: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("crypto", () => ({
  randomUUID: mocks.randomUUID,
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
}));

vi.mock("@/lib/db/language", () => ({
  languagePairFromProfile: mocks.languagePairFromProfile,
}));

vi.mock("@/lib/entries/translate", () => ({
  resolveTranslationText: mocks.resolveTranslationText,
  removeTranslation: mocks.removeTranslation,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mocks.prisma,
}));

import { DELETE, POST } from "@/app/api/entries/[id]/translate/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("api/entries/[id]/translate route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.randomUUID.mockReturnValue("uuid-1");
  });

  it("POST returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const req = new Request("http://localhost", { method: "POST", body: "{}" });
    const res = await POST(req, ctx("e1"));
    expect(res.status).toBe(401);
  });

  it("POST returns 400 on invalid json", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    const req = new Request("http://localhost", {
      method: "POST",
      body: "{",
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req, ctx("e1"));
    expect(res.status).toBe(400);
  });

  it("POST returns 404 when entry not found", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.prisma.journalEntry.findFirst.mockResolvedValueOnce(null);
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req, ctx("e1"));
    expect(res.status).toBe(404);
  });

  it("POST prefetch returns translated text without DB update", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.prisma.journalEntry.findFirst.mockResolvedValueOnce({
      id: "e1",
      translations: [],
      user: { languageProfile: { nativeLanguage: "en", targetLanguage: "es" } },
    });
    mocks.languagePairFromProfile.mockReturnValueOnce({ source: "en", target: "es" });
    mocks.resolveTranslationText.mockResolvedValueOnce({
      ok: true,
      sourceText: "hello",
      translatedText: "hola",
      fromExisting: null,
      fromServerMemory: false,
    });

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ text: "hello", intent: "prefetch" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req, ctx("e1"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      requestId: "uuid-1",
      sourceText: "hello",
      translatedText: "hola",
    });
    expect(mocks.prisma.journalEntry.update).not.toHaveBeenCalled();
  });

  it("POST commit returns existing translation without DB update", async () => {
    const existing = { id: "t1", sourceText: "hello", translatedText: "hola" };
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.prisma.journalEntry.findFirst.mockResolvedValueOnce({
      id: "e1",
      translations: [existing],
      user: { languageProfile: { nativeLanguage: "en", targetLanguage: "es" } },
    });
    mocks.languagePairFromProfile.mockReturnValueOnce({ source: "en", target: "es" });
    mocks.resolveTranslationText.mockResolvedValueOnce({
      ok: true,
      sourceText: "hello",
      translatedText: "hola",
      fromExisting: existing,
      fromServerMemory: false,
    });

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req, ctx("e1"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ translation: existing });
    expect(mocks.prisma.journalEntry.update).not.toHaveBeenCalled();
  });

  it("POST commit persists new translation record", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.prisma.journalEntry.findFirst.mockResolvedValueOnce({
      id: "e1",
      translations: [],
      user: { languageProfile: { nativeLanguage: "en", targetLanguage: "es" } },
    });
    mocks.languagePairFromProfile.mockReturnValueOnce({ source: "en", target: "es" });
    mocks.resolveTranslationText.mockResolvedValueOnce({
      ok: true,
      sourceText: "hello",
      translatedText: "hola",
      fromExisting: null,
      fromServerMemory: false,
    });
    mocks.prisma.journalEntry.update.mockResolvedValueOnce({});

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req, ctx("e1"));

    expect(mocks.prisma.journalEntry.update).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      translation: { id: "uuid-1", sourceText: "hello", translatedText: "hola" },
    });
  });

  it("DELETE returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const req = new Request("http://localhost", { method: "DELETE", body: "{}" });
    const res = await DELETE(req, ctx("e1"));
    expect(res.status).toBe(401);
  });

  it("DELETE returns 400 when translationId missing", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    const req = new Request("http://localhost", {
      method: "DELETE",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req, ctx("e1"));
    expect(res.status).toBe(400);
  });

  it("DELETE returns updated translations after removal", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.prisma.journalEntry.findFirst.mockResolvedValueOnce({
      id: "e1",
      translations: [{ id: "t1" }, { id: "t2" }],
    });
    mocks.removeTranslation.mockReturnValueOnce([{ id: "t2" }]);
    mocks.prisma.journalEntry.update.mockResolvedValueOnce({});

    const req = new Request("http://localhost", {
      method: "DELETE",
      body: JSON.stringify({ translationId: "t1" }),
      headers: { "content-type": "application/json" },
    });
    const res = await DELETE(req, ctx("e1"));

    expect(res.status).toBe(200);
    expect(mocks.removeTranslation).toHaveBeenCalledWith(
      [{ id: "t1" }, { id: "t2" }],
      "t1",
    );
    await expect(res.json()).resolves.toEqual({ translations: [{ id: "t2" }] });
  });
});
