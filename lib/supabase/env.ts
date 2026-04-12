function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export type SupabasePublicEnv = { url: string; anonKey: string };

/** Returns env only when URL is a real http(s) URL and anon key is non-empty (trimmed). */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!isValidHttpUrl(url) || anonKey.length === 0) {
    return null;
  }
  return { url, anonKey };
}

export function isSupabasePublicConfigured(): boolean {
  return getSupabasePublicEnv() !== null;
}

export function getSupabasePublicEnvOrThrow(): SupabasePublicEnv {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL (full https://… URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY in `.env`, then restart `next dev` (NEXT_PUBLIC_* values are read when the dev server starts).",
    );
  }
  return env;
}
