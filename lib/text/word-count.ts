/**
 * Counts words by splitting on runs of whitespace (after trim).
 * Whitespace-only or empty input yields 0.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function wordCountLabel(n: number): string {
  return n === 1 ? "1 word" : `${n} words`;
}
