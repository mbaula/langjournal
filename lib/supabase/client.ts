"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnvOrThrow } from "@/lib/supabase/env";

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnvOrThrow();
  return createBrowserClient(url, anonKey);
}
