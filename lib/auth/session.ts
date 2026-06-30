import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { safeNextPath } from "@/lib/auth/redirect";
import {
  DEV_ACCOUNT_PREVIEW_COOKIE,
  getDevPreviewUser,
  isDevAccountPreviewCookie,
} from "@/lib/dev/preview-account";
import { isDevEnvironment } from "@/lib/dev/preview";
import { ensureAppUser } from "@/lib/db/user";
import { createClient } from "@/lib/supabase/server";
import {
  MIDDLEWARE_USER_EMAIL_HEADER,
  MIDDLEWARE_USER_ID_HEADER,
  PATHNAME_HEADER,
} from "@/lib/supabase/middleware-forward";

export type AppUser = { id: string; email: string };

export const isAccountPreviewMode = cache(async (): Promise<boolean> => {
  if (!isDevEnvironment()) return false;
  const cookieStore = await cookies();
  return isDevAccountPreviewCookie(
    cookieStore.get(DEV_ACCOUNT_PREVIEW_COOKIE)?.value,
  );
});

async function resolveRedirectTo(fallback: string): Promise<string> {
  const headerStore = await headers();
  const pathname = headerStore.get(PATHNAME_HEADER);
  return safeNextPath(pathname ?? fallback);
}

const userFromMiddlewareHeaders = cache(async (): Promise<AppUser | null> => {
  const headerStore = await headers();
  const userId = headerStore.get(MIDDLEWARE_USER_ID_HEADER);
  const pathname = headerStore.get(PATHNAME_HEADER);
  
  if (!userId) {
    // Only log in production to help debug the settings redirect issue
    if (process.env.NODE_ENV === "production") {
      console.warn("[userFromMiddlewareHeaders] No user ID header found", {
        pathname,
        hasPathHeader: !!pathname,
      });
    }
    return null;
  }

  return {
    id: userId,
    email: headerStore.get(MIDDLEWARE_USER_EMAIL_HEADER) ?? "",
  };
});

/** Resolve the signed-in app user without redirecting (for API routes and loaders). */
export async function resolveAppUser(): Promise<AppUser | null> {
  if (await isAccountPreviewMode()) {
    return getDevPreviewUser();
  }

  const middlewareUser = await userFromMiddlewareHeaders();
  if (middlewareUser) {
    return middlewareUser;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return null;
  }

  return { id: user.id, email: user.email ?? "" };
}

/** Cached resolution of the current user - no redirect, just returns null if not found */
const resolveCurrentUser = cache(async (): Promise<AppUser | null> => {
  if (await isAccountPreviewMode()) {
    return getDevPreviewUser();
  }

  const middlewareUser = await userFromMiddlewareHeaders();
  if (middlewareUser) {
    return middlewareUser;
  }

  // If middleware headers missing, fall back to Supabase auth check
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    console.error("[resolveCurrentUser] Auth failed:", {
      error: error?.message,
      hasUser: !!user,
    });
    return null;
  }

  return { id: user.id, email: user.email ?? "" };
});

export async function requireAppSession(
  fallback = "/app/journal",
): Promise<AppUser> {
  const user = await resolveCurrentUser();
  
  if (!user) {
    const redirectTo = await resolveRedirectTo(fallback);
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return user;
}

export async function requireUser(fallback = "/app/journal"): Promise<AppUser> {
  const user = await requireAppSession(fallback);
  if (await isAccountPreviewMode()) {
    return user;
  }

  await ensureAppUser(user.id, user.email);
  return user;
}
