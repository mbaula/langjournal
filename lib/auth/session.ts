import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import {
  DEV_ACCOUNT_PREVIEW_COOKIE,
  getDevPreviewUser,
  isDevAccountPreviewCookie,
} from "@/lib/dev/preview-account";
import { isDevEnvironment } from "@/lib/dev/preview";
import { ensureAppUser } from "@/lib/db/user";
import { createClient } from "@/lib/supabase/server";

export type AppUser = { id: string; email: string };

export async function isAccountPreviewMode(): Promise<boolean> {
  if (!isDevEnvironment()) return false;
  const cookieStore = await cookies();
  return isDevAccountPreviewCookie(
    cookieStore.get(DEV_ACCOUNT_PREVIEW_COOKIE)?.value,
  );
}

export async function requireUser(redirectTo = "/app/journal"): Promise<AppUser> {
  if (await isAccountPreviewMode()) {
    return getDevPreviewUser();
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const email = user.email ?? "";
  await ensureAppUser(user.id, email);

  return { id: user.id, email };
}

/** Session check for /app routes — middleware already redirects unauthenticated users. */
export const requireAppSession = cache(async (
  redirectTo = "/app/journal",
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
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return { id: user.id, email: user.email ?? "" };
});
