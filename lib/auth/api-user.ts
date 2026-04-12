import { ensureAppUser } from "@/lib/db/user";
import { createClient } from "@/lib/supabase/server";

import type { AppUser } from "@/lib/auth/session";

export async function getAuthenticatedAppUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return null;
  }

  const email = user.email ?? "";
  await ensureAppUser(user.id, email);

  return { id: user.id, email };
}
