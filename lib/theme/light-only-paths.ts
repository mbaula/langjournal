/** Routes that always render in light mode (marketing home). */
export const LIGHT_ONLY_PATHS = ["/"] as const;

export function isLightOnlyPath(pathname: string): boolean {
  return (LIGHT_ONLY_PATHS as readonly string[]).includes(pathname);
}
