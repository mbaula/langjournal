/**
 * Maps simple language codes (used by Google Translate) to BCP-47 locale codes
 * for better Web Speech API voice matching.
 */
const BCP47_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-BR",
  nl: "nl-NL",
  ru: "ru-RU",
  ja: "ja-JP",
  ko: "ko-KR",
  ar: "ar-SA",
  hi: "hi-IN",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  pl: "pl-PL",
  tr: "tr-TR",
  vi: "vi-VN",
  th: "th-TH",
  sv: "sv-SE",
  da: "da-DK",
  no: "nb-NO",
  fi: "fi-FI",
  el: "el-GR",
  cs: "cs-CZ",
  ro: "ro-RO",
  hu: "hu-HU",
  uk: "uk-UA",
  id: "id-ID",
  ms: "ms-MY",
  he: "he-IL",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  ur: "ur-PK",
  fa: "fa-IR",
  sw: "sw-KE",
  tl: "tl-PH",
  fil: "fil-PH",
  sk: "sk-SK",
  bg: "bg-BG",
  hr: "hr-HR",
  sr: "sr-RS",
  sl: "sl-SI",
  lt: "lt-LT",
  lv: "lv-LV",
  et: "et-EE",
  ca: "ca-ES",
  eu: "eu-ES",
  gl: "gl-ES",
  cy: "cy-GB",
  ga: "ga-IE",
  af: "af-ZA",
  is: "is-IS",
};

export function toBcp47(languageCode: string): string {
  const trimmed = languageCode.trim();
  return BCP47_MAP[trimmed] ?? BCP47_MAP[trimmed.toLowerCase()] ?? trimmed;
}

export type VoiceInfo = {
  voice: SpeechSynthesisVoice;
  isNative: boolean;
  isExactMatch: boolean;
};

/**
 * Find the best available voice for a language code.
 * Prefers native/local voices, then exact language matches, then prefix matches.
 */
export function findBestVoice(
  languageCode: string,
  voices: SpeechSynthesisVoice[],
): VoiceInfo | null {
  if (!voices.length) return null;

  const bcp47 = toBcp47(languageCode);
  const langPrefix = bcp47.split("-")[0].toLowerCase();

  const exactMatches: VoiceInfo[] = [];
  const prefixMatches: VoiceInfo[] = [];

  for (const voice of voices) {
    const voiceLang = voice.lang.toLowerCase();
    const voicePrefix = voiceLang.split("-")[0];
    const isNative = voice.localService;

    if (voiceLang === bcp47.toLowerCase()) {
      exactMatches.push({ voice, isNative, isExactMatch: true });
    } else if (voicePrefix === langPrefix) {
      prefixMatches.push({ voice, isNative, isExactMatch: false });
    }
  }

  const sortByQuality = (a: VoiceInfo, b: VoiceInfo) => {
    if (a.isNative !== b.isNative) return a.isNative ? -1 : 1;
    return 0;
  };

  exactMatches.sort(sortByQuality);
  prefixMatches.sort(sortByQuality);

  return exactMatches[0] ?? prefixMatches[0] ?? null;
}
