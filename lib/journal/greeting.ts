const ENCOURAGING_SUBTITLES = [
  "Meow meow, have you written anything today?",
  "You should write something today (or else).",
  "Yo yo, have you written anything today?",
  "Who's a language nerd? You are!",
  "You should probably write something today (side-eye)",
] as const;

export function pickEncouragingSubtitle(
  date: Date = new Date(),
): string {
  const dayIndex = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000,
  );
  const index =
    ((dayIndex % ENCOURAGING_SUBTITLES.length) + ENCOURAGING_SUBTITLES.length) %
    ENCOURAGING_SUBTITLES.length;
  return ENCOURAGING_SUBTITLES[index] ?? ENCOURAGING_SUBTITLES[0];
}

export function journalGreetingName(
  displayName: string | null | undefined,
  email: string,
): string {
  const trimmed = displayName?.trim();
  if (trimmed) return trimmed;

  const local = email.split("@")[0]?.trim();
  if (local) {
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  return "there";
}
