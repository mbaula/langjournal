/**
 * Generates messages/prompts/{vi,zh-CN,es}.json from English prompts.
 * Requires GOOGLE_TRANSLATE_API_KEY for non-English locales.
 *
 * Usage: npx tsx scripts/generate-prompt-locale-files.ts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { CEFR_LEVELS, PROMPTS_BY_LEVEL } from "../lib/prompts/prompts";
import type { UiLocale } from "../lib/i18n/locales";

const TARGET_LOCALES: Exclude<UiLocale, "en">[] = ["vi", "zh-CN", "es"];

const GOOGLE_TARGET: Record<Exclude<UiLocale, "en">, string> = {
  vi: "vi",
  "zh-CN": "zh-CN",
  es: "es",
};

async function translateBatch(
  texts: string[],
  targetLanguage: string,
): Promise<string[]> {
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
      q: texts,
      source: "en",
      target: targetLanguage,
      format: "text",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Translate API ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    data?: { translations?: { translatedText?: string }[] };
  };

  const translations = data.data?.translations ?? [];
  return translations.map((item, i) => item.translatedText ?? texts[i]!);
}

async function translateAll(texts: string[], targetLanguage: string): Promise<string[]> {
  const batchSize = 40;
  const out: string[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const translated = await translateBatch(batch, targetLanguage);
    out.push(...translated);
    process.stdout.write(`  translated ${Math.min(i + batchSize, texts.length)}/${texts.length}\n`);
    await new Promise((r) => setTimeout(r, 200));
  }

  return out;
}

async function main() {
  const outDir = path.join(process.cwd(), "messages/prompts");
  await mkdir(outDir, { recursive: true });

  const enPayload = Object.fromEntries(
    CEFR_LEVELS.map((level) => [level, [...PROMPTS_BY_LEVEL[level]]]),
  );
  await writeFile(
    path.join(outDir, "en.json"),
    `${JSON.stringify(enPayload, null, 2)}\n`,
  );
  console.log("Wrote messages/prompts/en.json");

  const flatEnglish = CEFR_LEVELS.flatMap((level) =>
    PROMPTS_BY_LEVEL[level].map((text) => ({ level, text })),
  );

  for (const locale of TARGET_LOCALES) {
    const outPath = path.join(outDir, `${locale}.json`);
    try {
      await readFile(outPath, "utf8");
      console.log(`Skipping ${locale}.json (already exists)`);
      continue;
    } catch {
      // generate
    }

    console.log(`Translating prompts to ${locale}…`);
    const translated = await translateAll(flatEnglish.map((item) => item.text), GOOGLE_TARGET[locale]);

    const payload: Record<string, string[]> = Object.fromEntries(
      CEFR_LEVELS.map((level) => [level, [] as string[]]),
    );

    translated.forEach((text, i) => {
      const level = flatEnglish[i]!.level;
      payload[level]!.push(text);
    });

    await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Wrote messages/prompts/${locale}.json`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
