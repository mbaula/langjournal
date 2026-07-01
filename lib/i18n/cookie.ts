import type { UiLocale } from "@/lib/i18n/locales";
import { FOLIO_LOCALE_COOKIE } from "@/lib/i18n/locales";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function localeCookieOptions(locale: UiLocale) {
  return {
    name: FOLIO_LOCALE_COOKIE,
    value: locale,
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax" as const,
    httpOnly: false,
  };
}
