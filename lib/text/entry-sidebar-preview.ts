const DEFAULT_MAX = 88;

/**
 * Short label for sidebar when an entry has no title: first line / first sentence-ish chunk of body.
 */
export function bodySnippetForSidebar(
  body: string | null | undefined,
  maxLen = DEFAULT_MAX,
): string {
  const raw = (body ?? "").replace(/\r\n/g, "\n").trim();
  if (!raw) return "Empty entry";

  const firstBlock = raw.split(/\n{2,}/)[0] ?? raw;
  const firstLine = firstBlock.split("\n").find((l) => l.trim()) ?? firstBlock;
  const collapsed = firstLine.replace(/\s+/g, " ").trim();
  if (!collapsed) return "Empty entry";

  const sentence = collapsed.match(/^.{1,140}?[.!?](?=\s|$)/u);
  const base = sentence ? sentence[0].trim() : collapsed;
  if (base.length <= maxLen) return base;
  return `${base.slice(0, maxLen - 1).trimEnd()}…`;
}
