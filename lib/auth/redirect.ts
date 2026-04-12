/** Same-origin path only; avoids open redirects after magic-link callback. */
export function safeNextPath(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/app/journal";
  }
  return path;
}
