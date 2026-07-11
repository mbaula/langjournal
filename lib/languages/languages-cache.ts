import type { LanguageLabelOption } from "@/lib/languages/display-name";

type LanguagesListener = (languages: LanguageLabelOption[]) => void;

let cachedLanguages: LanguageLabelOption[] | null = null;
let inflight: Promise<LanguageLabelOption[] | null> | null = null;
const listeners = new Set<LanguagesListener>();

export function getCachedLanguages(): LanguageLabelOption[] | null {
  return cachedLanguages;
}

export function setCachedLanguages(languages: LanguageLabelOption[]): void {
  cachedLanguages = languages;
  for (const listener of listeners) {
    listener(languages);
  }
}

/** Test helper / logout hook — drop the in-memory catalog. */
export function clearCachedLanguages(): void {
  cachedLanguages = null;
  inflight = null;
}

export function subscribeCachedLanguages(listener: LanguagesListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Fetch once and reuse across tab remounts so labels don't flash the raw code. */
export async function fetchLanguagesCatalog(): Promise<LanguageLabelOption[] | null> {
  if (cachedLanguages?.length) {
    return cachedLanguages;
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const res = await fetch("/api/languages");
      const data = (await res.json()) as {
        error?: string;
        languages?: LanguageLabelOption[];
      };
      if (!res.ok || !data.languages?.length) {
        return null;
      }
      setCachedLanguages(data.languages);
      return data.languages;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
