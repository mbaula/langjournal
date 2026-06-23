import { cn } from "@/lib/utils";

export const appNavTabGroupClass =
  "inline-flex items-center gap-0.5 rounded-full border border-border bg-background p-1 sm:gap-1 sm:p-1.5";

export const appNavTabBase =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors sm:px-4 sm:py-2";

export function appNavTabClass(active: boolean, className?: string) {
  return cn(
    appNavTabBase,
    active
      ? "bg-primary font-medium text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground",
    className,
  );
}

export function appNavTabIconClass(active: boolean) {
  return cn("size-4 shrink-0", !active && "hidden");
}

export const appNavUtilityButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:px-3";
