import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/auth/redirect";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", url.origin).href,
    );
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    return NextResponse.redirect(
      new URL("/login?error=supabase_not_configured", url.origin).href,
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
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        url.origin,
      ).href,
    );
  }

  return NextResponse.redirect(new URL(next, url.origin).href);
}
