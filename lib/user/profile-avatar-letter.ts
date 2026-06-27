/** Single letter for the nav avatar — first letter of the first word (or email local part). */
export function profileAvatarLetter(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed || trimmed === "Account") return null;

  const head = trimmed.includes("@")
    ? (trimmed.split("@")[0]?.trim() ?? "")
    : (trimmed.split(/\s+/)[0] ?? "");

  if (!head) return null;

  const letter = head.match(/\p{L}/u)?.[0] ?? head[0];
  return letter ? letter.toUpperCase() : null;
}
