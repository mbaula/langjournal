import {
  DEFAULT_UI_LOCALE,
  isUiLocale,
  normalizeUiLocale,
  type UiLocale,
} from "@/lib/i18n/locales";

type ResolveLocaleInput = {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  profileLocale?: string | null;
  isAuthenticated?: boolean;
};

function parseAcceptLanguage(header: string): Array<{ tag: string; quality: number }> {
  return header
    .split(",")
    .map((part, index) => {
      const [tagPart, ...params] = part.trim().split(";");
      const tag = tagPart?.trim() ?? "";
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qParam
        ? Number.parseFloat(qParam.trim().slice(2))
        : index === 0
          ? 1
          : 0;
      return { tag, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.quality - a.quality);
}

export function resolveLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): UiLocale | null {
  if (!acceptLanguage?.trim()) {
    return null;
  }

  for (const { tag } of parseAcceptLanguage(acceptLanguage)) {
    const matched = normalizeUiLocale(tag);
    if (matched) {
      return matched;
    }
  }

  return null;
}

export function resolveLocale(input: ResolveLocaleInput): UiLocale {
  if (input.isAuthenticated && isUiLocale(input.profileLocale)) {
    return input.profileLocale;
  }

  const cookieMatch = normalizeUiLocale(input.cookieLocale ?? "");
  if (cookieMatch) {
    return cookieMatch;
  }

  const acceptMatch = resolveLocaleFromAcceptLanguage(input.acceptLanguage);
  if (acceptMatch) {
    return acceptMatch;
  }

  return DEFAULT_UI_LOCALE;
}
