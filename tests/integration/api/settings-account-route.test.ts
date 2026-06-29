import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedAppUser: vi.fn(),
  deleteUserAccount: vi.fn(),
  createAdminClient: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/auth/api-user", () => ({
  getAuthenticatedAppUser: mocks.getAuthenticatedAppUser,
}));

vi.mock("@/lib/db/delete-account", () => ({
  deleteUserAccount: mocks.deleteUserAccount,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signOut: mocks.signOut,
    },
  })),
}));

import { DELETE } from "@/app/api/settings/account/route";

describe("api/settings/account route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("DELETE returns 401 when unauthorized", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce(null);
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("DELETE works even when admin client is unavailable", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({
      id: "u1",
      email: "user@example.com",
    });
    mocks.createAdminClient.mockReturnValueOnce(null);
    mocks.deleteUserAccount.mockResolvedValueOnce(undefined);

    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(mocks.deleteUserAccount).toHaveBeenCalledWith("u1");
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it("DELETE removes account data and auth user", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({
      id: "u1",
      email: "user@example.com",
    });
    mocks.createAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValueOnce({ error: null }),
        },
      },
    });
    mocks.deleteUserAccount.mockResolvedValueOnce(undefined);

    const res = await DELETE();

    expect(mocks.deleteUserAccount).toHaveBeenCalledWith("u1");
    expect(mocks.signOut).toHaveBeenCalled();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("DELETE succeeds even when auth user deletion fails", async () => {
    mocks.getAuthenticatedAppUser.mockResolvedValueOnce({
      id: "u1",
      email: "user@example.com",
    });
    mocks.createAdminClient.mockReturnValueOnce({
      auth: {
        admin: {
          deleteUser: vi
            .fn()
            .mockResolvedValueOnce({ error: { message: "failed" } }),
        },
      },
    });
    mocks.deleteUserAccount.mockResolvedValueOnce(undefined);

    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(mocks.deleteUserAccount).toHaveBeenCalledWith("u1");
    expect(mocks.signOut).toHaveBeenCalled();
  });
});
