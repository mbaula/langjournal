import { v2 } from "@google-cloud/translate";

const MAX_CHARS = 3000;

let client: v2.Translate | null = null;

function getTranslateClient(): v2.Translate {
  if (!client) {
    client = new v2.Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }
  return client;
}

function hasApiKey(): boolean {
  return Boolean(process.env.GOOGLE_TRANSLATE_API_KEY?.trim());
}

function hasApplicationCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_CLOUD_PROJECT_ID ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

function isConfigured(): boolean {
  return hasApiKey() || hasApplicationCredentials();
}

export function isGoogleTranslateConfigured(): boolean {
  return isConfigured();
}

type TranslateV2RestResponse = {
  data?: { translations?: { translatedText?: string }[] };
  error?: { code?: number; message?: string; status?: string };
};

/**
 * Cloud Translation v2 over HTTPS with an API key (no service account JSON).
 * Create: APIs & Services → Credentials → API key → restrict to Cloud Translation API.
 */
async function translateWithApiKey(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!key) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY is not set");
  }

  const url = new URL("https://translation.googleapis.com/language/translate/v2");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: sourceLanguage,
      target: targetLanguage,
      format: "text",
    }),
  });

  const json = (await res.json()) as TranslateV2RestResponse;
  if (!res.ok || json.error) {
    throw new Error(
      json.error?.message ?? `Translation API error (${res.status})`,
    );
  }

  const translated = json.data?.translations?.[0]?.translatedText;
  if (typeof translated !== "string" || !translated) {
    throw new Error("Unexpected translation response");
  }
  return translated;
}

/**
 * Basic Text Translation (v2).
 *
 * Priority:
 * 1. `GOOGLE_TRANSLATE_API_KEY` — REST + API key (works when org blocks service account keys).
 * 2. `@google-cloud/translate` — needs `GOOGLE_CLOUD_PROJECT_ID` and/or
 *    `GOOGLE_APPLICATION_CREDENTIALS`, or local ADC (`gcloud auth application-default login`).
 */
export async function translatePlainText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed) {
    throw new Error("Nothing to translate");
  }
  if (trimmed.length > MAX_CHARS) {
    throw new Error(`Text exceeds ${MAX_CHARS} characters`);
  }

  if (!isConfigured()) {
    throw new Error("Google Cloud Translation is not configured");
  }

  if (hasApiKey()) {
    return translateWithApiKey(trimmed, sourceLanguage, targetLanguage);
  }

  const translate = getTranslateClient();
  const [result] = await translate.translate(trimmed, {
    from: sourceLanguage,
    to: targetLanguage,
  });

  if (typeof result !== "string") {
    throw new Error("Unexpected translation response");
  }
  return result;
}

export type TranslationLanguageOption = { code: string; name: string };

function sortLanguageOptions(rows: TranslationLanguageOption[]) {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

type LanguagesRestResponse = {
  data?: { languages?: { language?: string; name?: string }[] };
  error?: { message?: string };
};

/**
 * Languages Cloud Translation can translate to/from, with English labels.
 * Uses the same credentials as {@link translatePlainText}: API key REST first,
 * otherwise the Node client (ADC / service account).
 */
export async function listGoogleTranslationLanguages(): Promise<
  TranslationLanguageOption[] | null
> {
  if (hasApiKey()) {
    try {
      const key = process.env.GOOGLE_TRANSLATE_API_KEY!.trim();
      const url = new URL(
        "https://translation.googleapis.com/language/translate/v2/languages",
      );
      url.searchParams.set("key", key);
      url.searchParams.set("target", "en");
      const res = await fetch(url.toString());
      const json = (await res.json()) as LanguagesRestResponse;
      if (!res.ok || json.error) return null;
      const rows = json.data?.languages;
      if (!Array.isArray(rows)) return null;
      const mapped = rows
        .map((r) =>
          r.language && r.name
            ? { code: r.language, name: r.name }
            : null,
        )
        .filter((x): x is TranslationLanguageOption => x !== null);
      return sortLanguageOptions(mapped);
    } catch {
      return null;
    }
  }

  if (!isConfigured()) return null;

  try {
    const translate = getTranslateClient();
    const [languages] = await translate.getLanguages("en");
    if (!Array.isArray(languages)) return null;
    return sortLanguageOptions(
      languages.map((l) => ({
        code: l.code,
        name: l.name ?? l.code,
      })),
    );
  } catch {
    return null;
  }
}
