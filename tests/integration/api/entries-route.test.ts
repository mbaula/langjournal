import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedAppUser: vi.fn(),
  listJournalEntries: vi.fn(),
  getOrCreateJournalEntryForDate: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
}));

vi.mock("@/lib/entries/service", () => ({
  listJournalEntries: mocks.listJournalEntries,
  getOrCreateJournalEntryForDate: mocks.getOrCreateJournalEntryForDate,
}));

import { GET, POST } from "@/app/api/entries/route";

describe("api/entries route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns entries for authenticated user", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.listJournalEntries.mockResolvedValueOnce([{ id: "e1" }]);

    const res = await GET();
    expect(mocks.listJournalEntries).toHaveBeenCalledWith("u1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ entries: [{ id: "e1" }] });
  });

  it("POST returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const req = new Request("http://localhost", { method: "POST", body: "{}" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("POST returns 400 for malformed JSON body", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    const req = new Request("http://localhost", {
      method: "POST",
      body: "{",
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
  });

  it("POST returns 400 on validation errors", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ entryDate: "04/27/2026" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns 201 when creating a new entry", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.getOrCreateJournalEntryForDate.mockResolvedValueOnce({
      entry: { id: "e-new" },
      created: true,
    });

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ title: "New entry", entryDate: "2026-04-27" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({
      entry: { id: "e-new" },
      created: true,
    });
  });

  it("POST returns 200 when entry already exists", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({ id: "u1" });
    mocks.getOrCreateJournalEntryForDate.mockResolvedValueOnce({
      entry: { id: "e-existing" },
      created: false,
    });

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ title: "Existing entry" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      entry: { id: "e-existing" },
      created: false,
    });
  });
});
