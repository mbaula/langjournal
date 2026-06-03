import { describe, expect, it } from "vitest";

import {
  getAuthCallbackErrorMessage,
  loginUrlWithAuthError,
  resolveLoginErrorMessage,
} from "@/lib/auth/callback-errors";

describe("getAuthCallbackErrorMessage", () => {
  it("returns null when no auth error params are present", () => {
    expect(getAuthCallbackErrorMessage(new URLSearchParams())).toBeNull();
  });

  it("maps otp_expired to a friendly message", () => {
    expect(
      getAuthCallbackErrorMessage(
        new URLSearchParams({
          error: "access_denied",
          error_code: "otp_expired",
          error_description: "Email link is invalid or has expired",
        }),
      ),
    ).toBe("That sign-in link has expired. Request a new one below.");
  });

  it("uses error_description when no known code is present", () => {
    expect(
      getAuthCallbackErrorMessage(
        new URLSearchParams({
          error_description: "Something went wrong",
        }),
      ),
    ).toBe("Something went wrong");
  });

  it("maps missing_code from error param when error_code is absent", () => {
    expect(
      getAuthCallbackErrorMessage(
        new URLSearchParams({ error: "missing_code" }),
      ),
    ).toBe("Invalid sign-in link. Request a new one below.");
  });
});

describe("resolveLoginErrorMessage", () => {
  it("maps known error codes to friendly messages", () => {
    expect(resolveLoginErrorMessage("missing_code")).toBe(
      "Invalid sign-in link. Request a new one below.",
    );
  });

  it("passes through already-friendly messages", () => {
    const message = "That sign-in link has expired. Request a new one below.";
    expect(resolveLoginErrorMessage(message)).toBe(message);
  });
});

describe("loginUrlWithAuthError", () => {
  it("builds a login URL with an encoded error message", () => {
    const url = loginUrlWithAuthError(
      "https://langjournal-223b.vercel.app",
      "That sign-in link has expired. Request a new one below.",
    );

    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("error")).toBe(
      "That sign-in link has expired. Request a new one below.",
    );
  });
});
