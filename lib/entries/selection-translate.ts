import { matchTranslationCapitalization } from "@/lib/text/translation-capitalization";
import { normalizeTranslationSource } from "@/lib/text/translation-cache-key";

export type SelectionSegment = {
  start: number;
  end: number;
  selectedText: string;
  trimmed: string;
};

export function parseSelectionForTranslation(
  body: string,
  selectionStart: number,
  selectionEnd: number,
  minLength = 2,
): SelectionSegment | null {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  if (end <= start) return null;

  const selectedText = body.slice(start, end);
  const trimmed = selectedText.trim();
  if (trimmed.length < minLength) return null;

  return { start, end, selectedText, trimmed };
}

/** Replaces a highlighted range with translated text, preserving edge whitespace. */
export function tryApplySelectionTranslation(
  body: string,
  start: number,
  end: number,
  expectedNorm: string,
  translatedText: string,
): { next: string; cursor: number; appliedText: string } | null {
  const selectedText = body.slice(start, end);
  const leading = selectedText.match(/^\s*/)?.[0] ?? "";
  const trailing = selectedText.match(/\s*$/)?.[0] ?? "";
  const core = selectedText.slice(
    leading.length,
    selectedText.length - trailing.length,
  );
  if (!core || normalizeTranslationSource(core) !== expectedNorm) return null;

  const appliedCore = matchTranslationCapitalization(core, translatedText);
  const appliedText = leading + appliedCore + trailing;
  return {
    next: body.slice(0, start) + appliedText + body.slice(end),
    cursor: start + appliedText.length,
    appliedText,
  };
}
