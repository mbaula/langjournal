import { Globe } from "lucide-react";

import { cn } from "@/lib/utils";

export const languageBarTriggerClassName =
  "inline-flex w-fit max-w-full min-w-0 items-center gap-1.5 rounded-full bg-app-shell p-2 font-sans dark:border dark:border-foreground/14 dark:bg-muted dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)]";

export const languageBarLabelClassName =
  "flex h-9 min-w-0 items-center rounded-full bg-background px-4 text-sm font-medium tracking-[0.06em] whitespace-nowrap text-foreground uppercase dark:bg-card/80 dark:ring-1 dark:ring-foreground/8";

export const languageBarIconButtonClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm dark:ring-1 dark:ring-foreground/12";

export function formatLanguageCodeBadge(code: string): string {
  const base = code.split("-")[0]?.trim().toLowerCase() ?? code.trim().toLowerCase();
  if (!base) return code.toUpperCase();

  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(base);
    const letters = name?.replace(/[^a-zA-Z]/g, "") ?? "";
    if (letters.length >= 3) {
      return letters.slice(0, 3).toUpperCase();
    }
  } catch {
    // fall through
  }

  return base.slice(0, 3).toUpperCase();
}

type LanguageBarTriggerDisplayProps = {
  sourceCode: string;
  targetCode: string;
  className?: string;
};

export function LanguageBarTriggerDisplay({
  sourceCode,
  targetCode,
  className,
}: LanguageBarTriggerDisplayProps) {
  const sourceBadge = formatLanguageCodeBadge(sourceCode);
  const targetBadge = formatLanguageCodeBadge(targetCode);

  return (
    <div
      className={cn(
        languageBarTriggerClassName,
        "pointer-events-none select-none",
        className,
      )}
      aria-hidden
    >
      <span className={languageBarLabelClassName}>
        <span className="truncate">
          {sourceBadge} → {targetBadge}
        </span>
      </span>
      <span className={languageBarIconButtonClassName}>
        <Globe className="size-4" strokeWidth={1.5} />
      </span>
    </div>
  );
}
