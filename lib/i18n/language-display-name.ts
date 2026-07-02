import { resolveLanguageLabel } from "@/lib/languages/display-name";
import type { LanguageLabelOption } from "@/lib/languages/display-name";

const displayNameCache = new Map<string, Intl.DisplayNames>();

function getIntlDisplayNames(locale: string): Intl.DisplayNames {
  const cached = displayNameCache.get(locale);
  if (cached) return cached;

  const created = new Intl.DisplayNames([locale], { type: "language" });
  displayNameCache.set(locale, created);
  return created;
}

/** Localized language name for UI copy (e.g. "French" in the user's UI locale). */
export function getLocalizedLanguageDisplayName(
  code: string,
  locale: string,
  catalog?: readonly LanguageLabelOption[],
): string {
  const trimmed = code.trim();
  if (!trimmed) return trimmed;

  try {
    const name = getIntlDisplayNames(locale).of(trimmed);
    if (name && !name.includes("UNKNOWN")) return name;
  } catch {
    // fall through
  }

  return resolveLanguageLabel(trimmed, catalog);
}
