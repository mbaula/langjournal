import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnvOrThrow } from "@/lib/supabase/env";

export function getSupabaseServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return key.length > 0 ? key : null;
}

/** Server-only Supabase client with admin privileges. Returns null when not configured. */
export function createAdminClient() {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) {
    return null;
  }

  const { url } = getSupabasePublicEnvOrThrow();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
