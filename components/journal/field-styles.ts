import { cn } from "@/lib/utils";

/** Pill behind `//` segments while typing and around committed translations. */
export const journalTranslationHighlightClassName =
  "rounded bg-blue-100 px-0.5 py-px text-foreground [box-decoration-break:clone] dark:bg-blue-500/20 dark:text-foreground";

/**
 * Editor mirror highlight must not change text width; keep visual-only background.
 * Any horizontal/vertical padding here desynchronizes caret vs. mirrored text.
 */
export const journalEditorTranslationHighlightClassName =
  "rounded bg-blue-100 text-foreground [box-decoration-break:clone] dark:bg-blue-500/20 dark:text-foreground";

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

/** Write page: prompt column + entry editor column. */
export const journalWriteWorkspaceClassName =
  "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] xl:gap-12";

/** Write page editor block: fills the viewport below page chrome (incl. word count). */
export const journalWriteEditorMinHeightClassName =
  "min-h-[calc(100dvh-19rem)] sm:min-h-[calc(100dvh-20rem)]";

/** Bordered shell for today's write area and expanded past-entry editors. */
export const journalWriteAreaShellClassName =
  "flex min-w-0 flex-col rounded-2xl border border-border bg-muted/20 p-4 sm:p-5";

/** Shared shell for journal, entry, settings, and other app pages. */
export const appPageShellClassName =
  "flex w-full flex-col gap-8 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:gap-10";

/** @deprecated Use appPageShellClassName */
export const journalPageShellClassName = appPageShellClassName;

/** Primary pill action used in toolbars (New entry, Practice, etc.). */
export const primaryPillButtonClassName =
  "h-10 shrink-0 gap-1.5 rounded-full px-4 text-[13px] whitespace-nowrap shadow-sm";

/** Segmented icon toggle group matching primary pill controls. */
export const pillToggleGroupClassName =
  "inline-flex shrink-0 flex-nowrap items-center gap-2";

/** Secondary pill control matching the journal language bar. */
export const secondaryPillButtonClassName =
  "size-10 shrink-0 rounded-full border border-border bg-muted/80 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground";

/** Primary icon-only pill control. */
export const primaryPillIconButtonClassName =
  "size-10 shrink-0 rounded-full shadow-sm";

/** Primary page title (home greeting, entry title). */
export const journalPageTitleClassName =
  "text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-[1.875rem]";

/** Write page entry title — slightly smaller than the full entry page title. */
export const journalWriteTitleClassName =
  "text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-[1.375rem]";

export function journalBlockShellClassName(extra?: string) {
  return cn(
    "rounded-md border border-border bg-transparent p-0 shadow-none",
    extra,
  );
}
