export type LanguageOption = { code: string; name: string };

/** Ensure the user’s current codes always appear in the dropdown list. */
export function mergeProfileCodes(
  list: LanguageOption[],
  nativeCode: string,
  targetCode: string,
): LanguageOption[] {
  const byCode = new Map(list.map((l) => [l.code, l]));
  for (const code of [nativeCode, targetCode]) {
    if (!byCode.has(code)) {
      byCode.set(code, { code, name: code });
    }
  }
  return [...byCode.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  );
}
