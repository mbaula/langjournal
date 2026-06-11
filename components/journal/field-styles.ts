import { cn } from "@/lib/utils";

/** Blue pill behind `//` segments while typing and around committed translations. */
export const journalTranslationHighlightClassName =
  "rounded bg-blue-100 px-0.5 py-px text-foreground [box-decoration-break:clone]";

/**
 * Editor mirror highlight must not change text width; keep visual-only background.
 * Any horizontal/vertical padding here desynchronizes caret vs. mirrored text.
 */
export const journalEditorTranslationHighlightClassName =
  "rounded bg-blue-100 text-foreground [box-decoration-break:clone]";

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

/** Entry body: borderless canvas that grows with content and fills the page. */
export function journalEntryBodyClassName(...extra: (string | undefined)[]) {
  return cn(
    "journal-entry-textarea font-sans block w-full resize-none overflow-hidden break-words rounded-none border-0 bg-transparent px-0 py-1 text-[15px] leading-[1.65] text-foreground antialiased caret-foreground shadow-none outline-none selection:bg-primary/15 focus-visible:ring-0 placeholder:text-muted-foreground/70",
    ...extra,
  );
}

/** Shared shell for journal, entry, settings, and other app pages. */
export const appPageShellClassName =
  "flex w-full flex-col gap-8 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:gap-10";

/** @deprecated Use appPageShellClassName */
export const journalPageShellClassName = appPageShellClassName;

/** Primary pill action used in toolbars (New entry, Practice, etc.). */
export const primaryPillButtonClassName =
  "h-10 shrink-0 gap-1.5 rounded-full px-4 text-[13px] whitespace-nowrap shadow-sm";

/** Primary page title (home greeting, entry title). */
export const journalPageTitleClassName =
  "text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-[1.875rem]";

export function journalBlockShellClassName(extra?: string) {
  return cn(
    "rounded-md border border-border/80 bg-transparent p-0 shadow-none",
    extra,
  );
}
