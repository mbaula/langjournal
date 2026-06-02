export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isDevPreviewParam(
  value: string | null | undefined,
  preview: string,
): boolean {
  return isDevEnvironment() && value === preview;
}
