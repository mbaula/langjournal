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
  const pathname = headerStore.get("x-pathname");
  return safeNextPath(pathname ?? fallback);
}

export const requireAppSession = cache(async (
  fallback = "/app/journal",
): Promise<AppUser> => {
  if (await isAccountPreviewMode()) {
    return getDevPreviewUser();
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    const redirectTo = await resolveRedirectTo(fallback);
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return { id: user.id, email: user.email ?? "" };
});

export async function requireUser(fallback = "/app/journal"): Promise<AppUser> {
  const user = await requireAppSession(fallback);
  if (await isAccountPreviewMode()) {
    return user;
  }

  await ensureAppUser(user.id, user.email);
  return user;
}
