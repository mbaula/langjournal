import { cn } from "@/lib/utils";

/** Blue pill behind `//` segments while typing and around committed translations. */
export const journalTranslationHighlightClassName =
  "rounded bg-blue-100 px-0.5 py-px text-foreground [box-decoration-break:clone] dark:bg-blue-500/25";

/**
 * Editor mirror highlight must not change text width; keep visual-only background.
 * Any horizontal/vertical padding here desynchronizes caret vs. mirrored text.
 */
export const journalEditorTranslationHighlightClassName =
  "rounded bg-blue-100 text-foreground [box-decoration-break:clone] dark:bg-blue-500/25";

/** Journal home list: entry preview lines (matches date subtitle / page encouraging text). */
export const journalEntryPreviewTextClassName =
  "text-[13px] leading-normal text-foreground antialiased";

/** Shared look for journal textareas (sans, theme border, no browser-default serif). */
export function journalTextareaClassName(...extra: (string | undefined)[]) {
  return cn(
    "font-sans w-full resize-y rounded-md border-0 bg-transparent px-0 py-1 text-[15px] leading-[1.65] text-foreground antialiased caret-foreground shadow-none outline-none transition-[box-shadow] selection:bg-primary/15 focus-visible:ring-0",
    ...extra,
  );
}

export function journalBlockShellClassName(extra?: string) {
  return cn(
    "rounded-md border border-border/80 bg-transparent p-0 shadow-none",
    extra,
  );
}
