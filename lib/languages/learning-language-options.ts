import type { UserLanguageEntry } from "@/lib/db/onboarding";
import type { LanguageLabelOption } from "@/lib/languages/display-name";
import { getLocalizedLanguageDisplayName } from "@/lib/i18n/language-display-name";

/** Learning language codes for the bar, preserving onboarding order and including the active target if missing. */
export function buildLearningLanguageCodes(
  learningLanguages: readonly UserLanguageEntry[],
  activeTarget: string,
): string[] {
  const codes = learningLanguages.map((entry) => entry.languageCode);
  const trimmedTarget = activeTarget.trim();

  if (!trimmedTarget) {
    return codes;
  }

  const hasTarget = codes.some(
    (code) => code.toLowerCase() === trimmedTarget.toLowerCase(),
  );

  if (hasTarget) {
    return codes;
  }

  return [trimmedTarget, ...codes];
}

export function orderLearningLanguageOptions(
  learningLanguages: readonly UserLanguageEntry[],
  activeTarget: string,
  catalog: readonly LanguageLabelOption[],
  locale: string,
): LanguageLabelOption[] {
  return buildLearningLanguageCodes(learningLanguages, activeTarget).map(
    (code) => {
      const fromCatalog = catalog.find(
        (entry) => entry.code.toLowerCase() === code.toLowerCase(),
      );
      return (
        fromCatalog ?? {
          code,
          name: getLocalizedLanguageDisplayName(code, locale, catalog),
        }
      );
    },
  );
}
