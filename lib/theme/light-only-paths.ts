/** Routes that always render in light mode (marketing home, login, onboarding). */
export const LIGHT_ONLY_PATHS = ["/", "/login", "/onboarding"] as const;

export const FORCE_LIGHT_DATA_ATTR = "forceLight";
/** DOM attribute for scoped light tokens (`[data-force-light-scope]` in CSS). */
export const FORCE_LIGHT_SCOPE_ATTR = "data-force-light-scope";

export function normalizePathname(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function isLightOnlyPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (LIGHT_ONLY_PATHS as readonly string[]).includes(
    normalizePathname(pathname),
  );
}
