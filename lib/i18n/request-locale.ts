import { cookies, headers } from "next/headers";

import { resolveAppUser } from "@/lib/auth/session";
import { getLanguageProfile } from "@/lib/db/language";
import { FOLIO_LOCALE_COOKIE, type UiLocale } from "@/lib/i18n/locales";
import { resolveLocale } from "@/lib/i18n/resolve-locale";

export async function resolveRequestLocale(): Promise<UiLocale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const user = await resolveAppUser();

  let profileLocale: string | null = null;
  if (user) {
    const profile = await getLanguageProfile(user.id);
    profileLocale = profile?.uiLocale ?? null;
  }

  return resolveLocale({
    cookieLocale: cookieStore.get(FOLIO_LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
    profileLocale,
    isAuthenticated: Boolean(user),
  });
}
