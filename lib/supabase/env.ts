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

/**
 * For browser + server code that must talk to Supabase.
 * Throws a specific message so misnamed or empty `.env` keys are easier to fix.
 */
export function getSupabasePublicEnvOrThrow(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url) {
    const legacyUrl = process.env.SUPABASE_URL?.trim();
    if (legacyUrl) {
      throw new Error(
        "Rename `SUPABASE_URL` to `NEXT_PUBLIC_SUPABASE_URL` in `.env` (same https URL). Restart `next dev`.",
      );
    }
    throw new Error(
      "Missing `NEXT_PUBLIC_SUPABASE_URL` in `.env`. Supabase → Project Settings → API → Project URL. Restart `next dev` after saving.",
    );
  }

  if (!isValidHttpUrl(url)) {
    const hint = url.length > 60 ? `${url.slice(0, 60)}…` : url;
    throw new Error(
      `Invalid \`NEXT_PUBLIC_SUPABASE_URL\` (must be a full https:// URL). First characters: ${JSON.stringify(hint)}. Remove stray quotes/spaces; restart \`next dev\`.`,
    );
  }

  if (!anonKey) {
    const legacyKey = process.env.SUPABASE_ANON_KEY?.trim();
    if (legacyKey) {
      throw new Error(
        "Rename `SUPABASE_ANON_KEY` to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env` (same anon public key). Restart `next dev`.",
      );
    }
    throw new Error(
      "Missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`. Supabase → Project Settings → API → anon public. Restart `next dev` after saving.",
    );
  }

  return { url, anonKey };
}
