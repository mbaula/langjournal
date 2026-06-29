import { resolveAppUser, type AppUser } from "@/lib/auth/session";
import { ensureAppUser } from "@/lib/db/user";

export async function getAuthenticatedAppUser(): Promise<AppUser | null> {
  const user = await resolveAppUser();
  if (!user) {
    return null;
  }

  await ensureAppUser(user.id, user.email);
  return user;
}

/** Auth check without DB upsert — for hot paths where the user is already active. */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const user = await resolveAppUser();
  return user?.id ?? null;
}
