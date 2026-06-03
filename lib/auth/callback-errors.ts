const KNOWN_MESSAGES: Record<string, string> = {
  otp_expired: "That sign-in link has expired. Request a new one below.",
  missing_code: "Invalid sign-in link. Request a new one below.",
  supabase_not_configured: "Sign-in is temporarily unavailable. Please try again later.",
};

/** Supabase may redirect auth failures to Site URL with ?error=… query params. */
export function getAuthCallbackErrorMessage(
  searchParams: Pick<URLSearchParams, "get">,
): string | null {
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (!error && !errorCode && !errorDescription) {
    return null;
  }

  if (errorCode && KNOWN_MESSAGES[errorCode]) {
    return KNOWN_MESSAGES[errorCode];
  }

  if (error && KNOWN_MESSAGES[error]) {
    return KNOWN_MESSAGES[error];
  }

  if (errorDescription) {
    return errorDescription;
  }

  if (error === "access_denied") {
    return "Sign-in was cancelled or denied.";
  }

  if (error) {
    return error;
  }

  return "Sign-in failed. Please try again.";
}

/** Resolves a login page ?error= value (raw code or already-friendly text). */
export function resolveLoginErrorMessage(error: string): string {
  return KNOWN_MESSAGES[error] ?? error;
}

export function loginUrlWithAuthError(origin: string, message: string): URL {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  return url;
}
