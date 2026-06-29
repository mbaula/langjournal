import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import {
  MIDDLEWARE_USER_EMAIL_HEADER,
  MIDDLEWARE_USER_ID_HEADER,
  PATHNAME_HEADER,
  buildForwardedRequestHeaders,
} from "@/lib/supabase/middleware-forward";

function requestWithCookies(
  pathname: string,
  cookies: Record<string, string>,
): NextRequest {
  const url = new URL(`https://folio.app${pathname}`);
  const request = new NextRequest(url);
  for (const [name, value] of Object.entries(cookies)) {
    request.cookies.set(name, value);
  }
  return request;
}

describe("buildForwardedRequestHeaders", () => {
  it("sets pathname and mirrors request cookies on the Cookie header", () => {
    const request = requestWithCookies("/app/settings", {
      "sb-test-auth-token": "refreshed-token",
      other: "1",
    });

    const headers = buildForwardedRequestHeaders(request, "/app/settings");

    expect(headers.get(PATHNAME_HEADER)).toBe("/app/settings");
    expect(headers.get("cookie")).toBe(
      "sb-test-auth-token=refreshed-token; other=1",
    );
  });

  it("includes middleware user headers when a session user is present", () => {
    const request = requestWithCookies("/app/settings", {});

    const headers = buildForwardedRequestHeaders(request, "/app/settings", {
      id: "user-123",
      email: "alex@example.com",
    });

    expect(headers.get(MIDDLEWARE_USER_ID_HEADER)).toBe("user-123");
    expect(headers.get(MIDDLEWARE_USER_EMAIL_HEADER)).toBe("alex@example.com");
  });
});
