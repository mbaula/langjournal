import { randomUUID } from "crypto";

import { translatePlainText } from "@/lib/translate/google";

export type InlineTranslation = {
  id: string;
  /** The native text the user typed after `//`. */
  sourceText: string;
  translatedText: string;
};

const DOUBLE_SLASH_RE = /^\/\/\s?/;

/**
 * Scan `body` for `//`-prefixed lines that don't already have a translation.
 * Translate them one at a time (first untranslated `//` wins).
 *
 * The body is **not modified** — `//` markers stay so the user can always
 * click into the textarea and see/edit raw text.
 */
export async function translateSlashLines(
  body: string,
  existingTranslations: InlineTranslation[],
  sourceLanguage: string,
  targetLanguage: string,
): Promise<
  | { ok: true; translations: InlineTranslation[] }
  | { ok: false; error: string }
> {
  const lines = body.replace(/\r\n/g, "\n").split("\n");

  const alreadyTranslated = new Set(
    existingTranslations.map((t) => t.sourceText),
  );

  let found = false;
  const newTranslations: InlineTranslation[] = [...existingTranslations];

  for (const line of lines) {
    if (!DOUBLE_SLASH_RE.test(line)) continue;

    const raw = line.replace(DOUBLE_SLASH_RE, "").trim();
    if (!raw) continue;
    if (alreadyTranslated.has(raw)) continue;

    if (raw.length > 3000) {
      return { ok: false, error: "Text after // is too long (max 3000 chars)." };
    }

    let translatedText: string;
    try {
      translatedText = await translatePlainText(
        raw,
        sourceLanguage,
        targetLanguage,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Translation failed";
      return { ok: false, error: msg };
    }

    newTranslations.push({
      id: randomUUID(),
      sourceText: raw,
      translatedText,
    });
    alreadyTranslated.add(raw);
    found = true;
  }

  return { ok: true, translations: newTranslations };
}

export function removeTranslation(
  translations: InlineTranslation[],
  translationId: string,
): InlineTranslation[] {
  return translations.filter((t) => t.id !== translationId);
}
