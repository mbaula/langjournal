import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  getAuthCallbackErrorMessage,
  loginUrlWithAuthError,
  resolveLoginErrorMessage,
} from "@/lib/auth/callback-errors";
import { safeNextPath } from "@/lib/auth/redirect";
import { getOnboardingState } from "@/lib/db/onboarding";
import { ensureAppUser } from "@/lib/db/user";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function redirectWithSessionCookies(
  target: URL,
  sessionCookies: PendingCookie[],
): NextResponse {
  const response = NextResponse.redirect(target);
  for (const { name, value, options } of sessionCookies) {
    response.cookies.set(name, value, options);
  }
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    const authError =
      getAuthCallbackErrorMessage(url.searchParams) ??
      "Invalid sign-in link. Request a new one below.";
    return NextResponse.redirect(
      loginUrlWithAuthError(url.origin, authError).href,
    );
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    return NextResponse.redirect(
      loginUrlWithAuthError(
        url.origin,
        resolveLoginErrorMessage("supabase_not_configured"),
      ).href,
    );
  }

  const sessionCookies: PendingCookie[] = [];
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        sessionCookies.push(...cookiesToSet);
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      loginUrlWithAuthError(url.origin, error.message).href,
    );
  }

  let redirectPath = next;

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError) {
    console.error("Auth callback: getUser failed:", getUserError.message);
    return NextResponse.redirect(
      loginUrlWithAuthError(url.origin, "Sign-in failed. Please try again.").href,
    );
  }

  if (user?.id) {
    try {
      await ensureAppUser(user.id, user.email ?? "");
    } catch (err) {
      console.error("Auth callback: ensureAppUser failed:", err);
      return NextResponse.redirect(
        loginUrlWithAuthError(url.origin, "Sign-in failed. Please try again.").href,
      );
    }

    try {
      const onboarding = await getOnboardingState(user.id);
      if (!onboarding.isComplete) {
        redirectPath = "/onboarding";
      }
    } catch (err) {
      console.error("Auth callback: getOnboardingState failed:", err);
      redirectPath = "/onboarding";
    }
  }

  return redirectWithSessionCookies(
    new URL(redirectPath, url.origin),
    sessionCookies,
  );
}
