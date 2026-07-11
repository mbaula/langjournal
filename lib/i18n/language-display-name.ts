import {
  isFallbackLanguageCode,
  resolveLanguageLabel,
} from "@/lib/languages/display-name";
import type { LanguageLabelOption } from "@/lib/languages/display-name";

const displayNameCache = new Map<string, Intl.DisplayNames>();

function getIntlDisplayNames(locale: string): Intl.DisplayNames {
  const cached = displayNameCache.get(locale);
  if (cached) return cached;

  const created = new Intl.DisplayNames([locale], { type: "language" });
  displayNameCache.set(locale, created);
  return created;
}

function isUnresolvedDisplayName(code: string, name: string): boolean {
  if (name.includes("UNKNOWN")) return true;
  // Intl returns the tag itself for codes it doesn't recognize (e.g. "btx").
  return name.toLowerCase() === code.toLowerCase();
}

/**
 * Localized language name for UI copy (e.g. "French" in the user's UI locale).
 *
 * Rare codes like "btx" are resolved from the translation catalog when possible.
 * We avoid trusting `Intl.DisplayNames` for codes outside our fallback list —
 * Node and browsers ship different ICU data and disagree (SSR hydration mismatch).
 */
export function getLocalizedLanguageDisplayName(
  code: string,
  locale: string,
  catalog?: readonly LanguageLabelOption[],
): string {
  const trimmed = code.trim();
  if (!trimmed) return trimmed;

  const fromCatalog = resolveLanguageLabel(trimmed, catalog);
  const catalogResolved =
    fromCatalog.toLowerCase() !== trimmed.toLowerCase() ? fromCatalog : null;

  // Obscure codes: Node ICU often lacks them while Chromium has them.
  // Prefer the catalog (stable) over environment-specific Intl.
  if (!isFallbackLanguageCode(trimmed)) {
    return catalogResolved ?? trimmed;
  }

  try {
    const name = getIntlDisplayNames(locale).of(trimmed);
    if (name && !isUnresolvedDisplayName(trimmed, name)) {
      return name;
    }
  } catch {
    // fall through
  }

  return catalogResolved ?? trimmed;
}
