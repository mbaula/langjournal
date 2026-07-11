export const UI_LOCALES = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "zh-CN", label: "简体中文" },
  { code: "es", label: "Español" },
] as const;

export const UI_LOCALE_CODES = [
  "en",
  "vi",
  "zh-CN",
  "es",
] as const;

export type UiLocale = (typeof UI_LOCALE_CODES)[number];

export const DEFAULT_UI_LOCALE: UiLocale = "en";

export const FOLIO_LOCALE_COOKIE = "folio-locale";

export function isUiLocale(value: string | null | undefined): value is UiLocale {
  return UI_LOCALE_CODES.includes(value as UiLocale);
}

export function uiLocaleLabel(code: UiLocale): string {
  return UI_LOCALES.find((locale) => locale.code === code)?.label ?? code;
}

export function normalizeUiLocale(value: string): UiLocale | null {
  const normalized = value.trim();
  if (isUiLocale(normalized)) {
    return normalized;
  }

  const lower = normalized.toLowerCase();
  if (lower === "zh" || lower.startsWith("zh-")) {
    if (lower.includes("tw") || lower.includes("hant")) {
      return null;
    }
    return "zh-CN";
  }

  const primary = lower.split("-")[0];
  if (isUiLocale(primary)) {
    return primary;
  }

  return null;
}
