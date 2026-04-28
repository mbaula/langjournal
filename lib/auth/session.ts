import { redirect } from "next/navigation";

import { ensureAppUser } from "@/lib/db/user";
import { createClient } from "@/lib/supabase/server";

export type AppUser = { id: string; email: string };

export async function requireUser(redirectTo = "/app/journal"): Promise<AppUser> {
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
