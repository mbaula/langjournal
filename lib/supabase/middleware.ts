import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  getAuthCallbackErrorMessage,
  loginUrlWithAuthError,
} from "@/lib/auth/callback-errors";
import { safeNextPath } from "@/lib/auth/redirect";
import { DEV_ACCOUNT_PREVIEW_COOKIE } from "@/lib/dev/preview-account";
import { isDevEnvironment, isDevPreviewParam } from "@/lib/dev/preview";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const env = getSupabasePublicEnv();
  if (!env) {
    return NextResponse.next({ request });
  }

  const { url: supabaseUrl, anonKey: supabaseAnonKey } = env;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const authError = getAuthCallbackErrorMessage(request.nextUrl.searchParams);
  if (authError && (pathname === "/" || pathname === "/auth/callback")) {
    return NextResponse.redirect(
      loginUrlWithAuthError(request.nextUrl.origin, authError),
    );
  }

  if (user && pathname === "/") {
    const previewMarketing = isDevPreviewParam(
      request.nextUrl.searchParams.get("preview"),
      "marketing",
    );

    if (!previewMarketing) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/journal";
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath(request.nextUrl.searchParams.get("redirectTo"));
    url.search = "";
    return NextResponse.redirect(url);
  }

  const accountPreviewActive =
    isDevEnvironment() &&
    (isDevPreviewParam(
      request.nextUrl.searchParams.get("preview"),
      "account",
    ) ||
      request.cookies.get(DEV_ACCOUNT_PREVIEW_COOKIE)?.value === "1");

  if (accountPreviewActive && pathname.startsWith("/app")) {
    if (
      isDevPreviewParam(
        request.nextUrl.searchParams.get("preview"),
        "account",
      )
    ) {
      supabaseResponse.cookies.set(DEV_ACCOUNT_PREVIEW_COOKIE, "1", {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        maxAge: 60 * 60 * 8,
      });
    }
    return supabaseResponse;
  }

  if (
    !user &&
    (pathname.startsWith("/app") || pathname === "/app")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "redirectTo",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
