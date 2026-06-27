import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUserId: vi.fn(),
  getJournalEntryForUser: vi.fn(),
  updateJournalEntryTitle: vi.fn(),
  updateJournalEntryBody: vi.fn(),
  updateJournalEntryTranslations: vi.fn(),
  deleteJournalEntryForUser: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedUserId: mocks.getAuthenticatedUserId,
}));

vi.mock("@/lib/entries/service", () => ({
  getJournalEntryForUser: mocks.getJournalEntryForUser,
  updateJournalEntryTitle: mocks.updateJournalEntryTitle,
  updateJournalEntryBody: mocks.updateJournalEntryBody,
  updateJournalEntryTranslations: mocks.updateJournalEntryTranslations,
  deleteJournalEntryForUser: mocks.deleteJournalEntryForUser,
}));

import { DELETE, GET, PATCH } from "@/app/api/entries/[id]/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("api/entries/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValueOnce(null);
    const res = await GET(new Request("http://localhost"), ctx("e1"));
    expect(res.status).toBe(401);
  });

  it("GET returns 404 when entry not found", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValueOnce("u1");
    mocks.getJournalEntryForUser.mockResolvedValueOnce(null);

    const res = await GET(new Request("http://localhost"), ctx("e1"));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Not found" });
  });

  it("GET returns entry when found", async () => {
    const entry = { id: "e1", title: "Title" };
    mocks.getAuthenticatedUserId.mockResolvedValueOnce("u1");
    mocks.getJournalEntryForUser.mockResolvedValueOnce(entry);

    const res = await GET(new Request("http://localhost"), ctx("e1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ entry });
  });

  it("PATCH returns 400 on invalid JSON body", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValueOnce("u1");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: "{",
      headers: { "content-type": "application/json" },
    });

    const res = await PATCH(req, ctx("e1"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
  });

  it("PATCH returns 400 on schema validation failure", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValueOnce("u1");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });

    const res = await PATCH(req, ctx("e1"));
    expect(res.status).toBe(400);
  });

  it("PATCH updates title/body and returns updated entry", async () => {
    const updated = { id: "e1", title: "T", body: "B" };
    mocks.getAuthenticatedUserId.mockResolvedValueOnce("u1");
    mocks.updateJournalEntryTitle.mockResolvedValueOnce({ ok: true });
    mocks.updateJournalEntryBody.mockResolvedValueOnce({ ok: true });
    mocks.getJournalEntryForUser.mockResolvedValueOnce(updated);

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ title: "T", body: "B" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req, ctx("e1"));

    expect(res.status).toBe(200);
    expect(mocks.updateJournalEntryTitle).toHaveBeenCalledWith("e1", "u1", "T");
    expect(mocks.updateJournalEntryBody).toHaveBeenCalledWith("e1", "u1", "B");
    await expect(res.json()).resolves.toEqual({ entry: updated });
  });

  it("DELETE returns 404 when service says not found", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValueOnce("u1");
    mocks.deleteJournalEntryForUser.mockResolvedValueOnce({
      ok: false,
      error: "not_found",
    });

    const res = await DELETE(new Request("http://localhost"), ctx("e1"));
    expect(res.status).toBe(404);
  });

  it("DELETE returns 204 on success", async () => {
    mocks.getAuthenticatedUserId.mockResolvedValueOnce("u1");
    mocks.deleteJournalEntryForUser.mockResolvedValueOnce({ ok: true });

    const res = await DELETE(new Request("http://localhost"), ctx("e1"));
    expect(res.status).toBe(204);
  });
});
