import type { FlashcardProficiency } from "@prisma/client";

import { PROFICIENCY_LABELS } from "@/lib/flashcards/types";
import { cn } from "@/lib/utils";

const PROFICIENCY_STYLES: Record<FlashcardProficiency, string> = {
  NEW: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  LEARNING: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  FAMILIAR: "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200",
  MASTERED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
};

type ProficiencyBadgeProps = {
  proficiency: FlashcardProficiency;
  className?: string;
};

export function ProficiencyBadge({ proficiency, className }: ProficiencyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        PROFICIENCY_STYLES[proficiency],
        className,
      )}
    >
      {PROFICIENCY_LABELS[proficiency]}
    </span>
  );
}
