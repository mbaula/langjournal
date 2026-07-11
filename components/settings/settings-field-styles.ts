/** Label on the left, control on the right — equal 50/50 columns. */
export const settingsFieldRowClassName =
  "grid grid-cols-2 items-center gap-x-4 gap-y-2";

/** Same grid, top-aligned for multi-line controls. */
export const settingsFieldRowStartClassName =
  "grid grid-cols-2 items-start gap-x-4 gap-y-2";

export const settingsInputClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-60";

export const settingsSelectClassName = `${settingsInputClassName} cursor-pointer`;

/** Compact trigger for language/level pickers inside settings rows. */
export const settingsLanguagePickerTriggerClassName =
  "h-auto min-h-[2.375rem] rounded-lg border-border bg-background px-3 py-2 pr-9 text-sm shadow-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35";

/** Search input styling for language combobox in settings. */
export const settingsLanguageComboboxInputClassName =
  "h-auto min-h-[2.375rem] rounded-lg border-border bg-background py-2 pl-9 pr-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35";
