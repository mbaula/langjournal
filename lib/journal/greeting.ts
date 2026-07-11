const SUBTITLE_COUNT = 5;

export function encouragingSubtitleIndex(date: Date = new Date()): number {
  const dayIndex = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000,
  );
  return (
    ((dayIndex % SUBTITLE_COUNT) + SUBTITLE_COUNT) %
    SUBTITLE_COUNT
  );
}

/** @deprecated Use encouragingSubtitleIndex with i18n messages */
export function pickEncouragingSubtitle(date: Date = new Date()): string {
  const subtitles = [
    "Meow meow, have you written anything today?",
    "You should write something today (or else).",
    "Yo yo, have you written anything today?",
    "Who's a language nerd? You are!",
    "You should probably write something today (side-eye)",
  ] as const;
  return subtitles[encouragingSubtitleIndex(date)] ?? subtitles[0];
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
