import { type NextRequest, NextResponse } from "next/server";

export const PATHNAME_HEADER = "x-pathname";
export const MIDDLEWARE_USER_ID_HEADER = "x-middleware-user-id";
export const MIDDLEWARE_USER_EMAIL_HEADER = "x-middleware-user-email";

/** Build headers for the request Next.js forwards to Server Components / Route Handlers. */
export function buildForwardedRequestHeaders(
  request: NextRequest,
  pathname: string,
  user?: { id: string; email?: string | null } | null,
): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, pathname);

  // `request.cookies.set()` in middleware does not always update the forwarded
  // Cookie header when only custom headers are passed to NextResponse.next().
  const cookies = request.cookies.getAll();
  if (cookies.length > 0) {
    requestHeaders.set(
      "cookie",
      cookies.map(({ name, value }) => `${name}=${value}`).join("; "),
    );
  }

  if (user?.id) {
    requestHeaders.set(MIDDLEWARE_USER_ID_HEADER, user.id);
    if (user.email) {
      requestHeaders.set(MIDDLEWARE_USER_EMAIL_HEADER, user.email);
    } else {
      requestHeaders.delete(MIDDLEWARE_USER_EMAIL_HEADER);
    }
  } else {
    requestHeaders.delete(MIDDLEWARE_USER_ID_HEADER);
    requestHeaders.delete(MIDDLEWARE_USER_EMAIL_HEADER);
  }

  return requestHeaders;
}

export function nextWithForwardedRequest(
  request: NextRequest,
  pathname: string,
  user?: { id: string; email?: string | null } | null,
): NextResponse {
  return NextResponse.next({
    request: {
      headers: buildForwardedRequestHeaders(request, pathname, user),
    },
  });
}

export function copyResponseCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

export function attachForwardedRequest(
  response: NextResponse,
  request: NextRequest,
  pathname: string,
  user?: { id: string; email?: string | null } | null,
): NextResponse {
  const next = nextWithForwardedRequest(request, pathname, user);
  copyResponseCookies(response, next);
  return next;
}
