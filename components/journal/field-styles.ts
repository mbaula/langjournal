import { cn } from "@/lib/utils";

/** Shared look for journal textareas (sans, theme border, no browser-default serif). */
export function journalTextareaClassName(extra?: string) {
  return cn(
    "font-sans w-full resize-y rounded-xl border border-border/70 bg-background px-4 py-3 text-base leading-relaxed text-foreground antialiased caret-foreground shadow-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35",
    extra,
  );
}

export function journalBlockShellClassName(extra?: string) {
  return cn(
    "rounded-2xl border border-border/60 bg-background/80 p-1 shadow-sm backdrop-blur-sm",
    extra,
  );
}
