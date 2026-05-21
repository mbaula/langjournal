import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";

const NAME_BY_CODE = new Map(
  FALLBACK_LANGUAGES.map((lang) => [lang.code, lang.name]),
);

export function getLanguageDisplayName(code: string): string {
  return NAME_BY_CODE.get(code) ?? code;
}
