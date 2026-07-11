/**
 * Label for sidebar when an entry has no title.
 */
export function bodySnippetForSidebar(
  body: string | null | undefined,
): string {
  const raw = (body ?? "").replace(/\r\n/g, "\n").trim();
  if (!raw) return "Empty entry";
  return raw;
}
