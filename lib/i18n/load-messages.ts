import { readFileSync } from "node:fs";
import path from "node:path";

import { isUiLocale, type UiLocale } from "@/lib/i18n/locales";

type Messages = Record<string, unknown>;

/**
 * Load UI messages for the given locale.
 *
 * In development we read JSON from disk on every request so edits to
 * messages/*.json show up after a browser refresh. Turbopack 16.2+ does not
 * reliably invalidate dynamic JSON imports used by next-intl (see Next.js #91765).
 */
export async function loadMessages(locale: string): Promise<Messages> {
  const resolvedLocale: UiLocale = isUiLocale(locale) ? locale : "en";

  if (process.env.NODE_ENV === "development") {
    const filePath = path.join(
      process.cwd(),
      "messages",
      `${resolvedLocale}.json`,
    );
    return JSON.parse(readFileSync(filePath, "utf8")) as Messages;
  }

  switch (resolvedLocale) {
    case "vi":
      return (await import("@/messages/vi.json")).default as Messages;
    case "zh-CN":
      return (await import("@/messages/zh-CN.json")).default as Messages;
    case "es":
      return (await import("@/messages/es.json")).default as Messages;
    default:
      return (await import("@/messages/en.json")).default as Messages;
  }
}
