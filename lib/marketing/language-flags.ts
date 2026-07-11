import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";

/**
 * Representative ISO 3166-1 alpha-2 (or flagcdn subdivision) codes for each
 * supported translation language. Kept in sync with {@link FALLBACK_LANGUAGES}.
 */
export const LANGUAGE_CODE_TO_FLAG: Record<string, string> = {
  af: "za",
  sq: "al",
  am: "et",
  ar: "sa",
  hy: "am",
  az: "az",
  eu: "es",
  be: "by",
  bn: "bd",
  bs: "ba",
  bg: "bg",
  ca: "es",
  ceb: "ph",
  "zh-CN": "cn",
  "zh-TW": "tw",
  co: "fr",
  hr: "hr",
  cs: "cz",
  da: "dk",
  nl: "nl",
  en: "gb",
  et: "ee",
  fi: "fi",
  fr: "fr",
  fy: "nl",
  gl: "es",
  ka: "ge",
  de: "de",
  el: "gr",
  gu: "in",
  ht: "ht",
  ha: "ng",
  haw: "us",
  he: "il",
  hi: "in",
  hmn: "la",
  hu: "hu",
  is: "is",
  ig: "ng",
  id: "id",
  ga: "ie",
  it: "it",
  ja: "jp",
  jv: "id",
  kn: "in",
  kk: "kz",
  km: "kh",
  rw: "rw",
  ko: "kr",
  ku: "iq",
  ky: "kg",
  lo: "la",
  la: "va",
  lv: "lv",
  lt: "lt",
  lb: "lu",
  mk: "mk",
  mg: "mg",
  ms: "my",
  ml: "in",
  mt: "mt",
  mi: "nz",
  mr: "in",
  mn: "mn",
  my: "mm",
  ne: "np",
  no: "no",
  ny: "mw",
  or: "in",
  ps: "af",
  fa: "ir",
  pl: "pl",
  pt: "pt",
  pa: "in",
  ro: "ro",
  ru: "ru",
  sm: "ws",
  gd: "gb",
  sr: "rs",
  st: "ls",
  sn: "zw",
  sd: "pk",
  si: "lk",
  sk: "sk",
  sl: "si",
  so: "so",
  es: "es",
  su: "id",
  sw: "ke",
  sv: "se",
  tg: "tj",
  ta: "in",
  tt: "ru",
  te: "in",
  th: "th",
  tr: "tr",
  tk: "tm",
  uk: "ua",
  ur: "pk",
  ug: "cn",
  uz: "uz",
  vi: "vn",
  cy: "gb-wls",
  xh: "za",
  yi: "il",
  yo: "ng",
  zu: "za",
  fil: "ph",
  tl: "ph",
};

/** Languages with no suitable country/region flag (e.g. constructed languages). */
export const LANGUAGES_WITHOUT_FLAG = new Set(["eo"]);

/**
 * Flag codes for the marketing marquee — one per supported language that has a
 * flag, in {@link FALLBACK_LANGUAGES} order (unique by flag image).
 */
export const SUPPORTED_LANGUAGE_FLAG_CODES: string[] = (() => {
  const seen = new Set<string>();
  const codes: string[] = [];

  for (const { code } of FALLBACK_LANGUAGES) {
    if (LANGUAGES_WITHOUT_FLAG.has(code)) continue;
    const flag = LANGUAGE_CODE_TO_FLAG[code];
    if (!flag || seen.has(flag)) continue;
    seen.add(flag);
    codes.push(flag);
  }

  return codes;
})();

export function flagImageUrl(countryCode: string): string {
  return `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
}
