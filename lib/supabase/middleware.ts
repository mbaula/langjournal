import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { safeNextPath } from "@/lib/auth/redirect";
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

  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/app/journal";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath(request.nextUrl.searchParams.get("redirectTo"));
    url.search = "";
    return NextResponse.redirect(url);
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
