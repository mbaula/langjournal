import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getAuthCallbackErrorMessage,
  loginUrlWithAuthError,
  resolveLoginErrorMessage,
} from "@/lib/auth/callback-errors";
import { safeNextPath } from "@/lib/auth/redirect";
import { getOnboardingState } from "@/lib/db/onboarding";
import { ensureAppUser } from "@/lib/db/user";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function GET(request: Request) {
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

  const cookieStore = await cookies();
  const supabase = createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      loginUrlWithAuthError(url.origin, error.message).href,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    await ensureAppUser(user.id, user.email ?? "");
    const onboarding = await getOnboardingState(user.id);
    if (!onboarding.isComplete) {
      return NextResponse.redirect(new URL("/onboarding", url.origin).href);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin).href);
}
