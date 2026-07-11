import { unstable_cache } from "next/cache";

import type { LanguageLabelOption } from "@/lib/languages/display-name";
import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";
import { listGoogleTranslationLanguages } from "@/lib/translate/google";

async function loadSupportedLanguages(): Promise<LanguageLabelOption[]> {
  const fromGoogle = await listGoogleTranslationLanguages();
  return fromGoogle ?? FALLBACK_LANGUAGES;
}

/**
 * Supported translation languages for UI labels (Google when configured,
 * otherwise the static fallback list). Cached so journal SSR stays fast.
 */
export const getSupportedLanguages = unstable_cache(
  loadSupportedLanguages,
  ["supported-translation-languages-v1"],
  { revalidate: 60 * 60 * 24 },
);
