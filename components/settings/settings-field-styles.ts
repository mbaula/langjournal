/** Label on the left, control on the right — equal 50/50 columns. */
export const settingsFieldRowClassName =
  "grid grid-cols-2 items-center gap-x-4 gap-y-2";

/** Same grid, top-aligned for multi-line controls. */
export const settingsFieldRowStartClassName =
  "grid grid-cols-2 items-start gap-x-4 gap-y-2";

export const settingsInputClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-60";

export const settingsSelectClassName = `${settingsInputClassName} cursor-pointer`;
