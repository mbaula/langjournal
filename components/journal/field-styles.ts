import { cn } from "@/lib/utils";

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
