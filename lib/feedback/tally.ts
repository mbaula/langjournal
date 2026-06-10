const TALLY_HOST_PATTERN = /(^|\.)tally\.so$/i;

function parseTallyFormIdFromUrl(url: URL): string | null {
  if (!TALLY_HOST_PATTERN.test(url.hostname)) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "r" && parts[1]) {
    return parts[1];
  }
  if (parts[0]) {
    return parts[0];
  }

  return null;
}

/** Returns the Tally form id from `NEXT_PUBLIC_TALLY_FEEDBACK_URL` (full URL or raw id). */
export function getTallyFeedbackFormId(): string | null {
  const raw = process.env.NEXT_PUBLIC_TALLY_FEEDBACK_URL?.trim() ?? "";
  if (!raw) {
    return null;
  }

  try {
    const id = parseTallyFormIdFromUrl(new URL(raw));
    if (id) {
      return id;
    }
  } catch {
    // Fall through — treat as a raw form id.
  }

  return /^[a-zA-Z0-9_-]+$/.test(raw) ? raw : null;
}

export function isTallyFeedbackConfigured(): boolean {
  return getTallyFeedbackFormId() !== null;
}
