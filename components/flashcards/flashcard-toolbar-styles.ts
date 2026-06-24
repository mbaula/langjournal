import { cn } from "@/lib/utils";

/** Shared slim pill surface for Practice toolbar controls. */
export const flashcardToolbarPillSurfaceClassName =
  "h-8 rounded-full border border-border bg-background text-sm text-foreground shadow-none transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export const flashcardToolbarPillTriggerClassName = cn(
  flashcardToolbarPillSurfaceClassName,
  "relative inline-flex shrink-0 items-center px-3 pr-8 font-medium",
);

export const flashcardToolbarPillMenuClassName =
  "absolute top-[calc(100%+0.375rem)] left-0 z-50 min-w-full overflow-hidden rounded-2xl border border-border bg-background p-1 text-foreground shadow-lg";

export const flashcardToolbarPillMenuItemClassName =
  "flex w-full items-center rounded-full px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted/50";

export const flashcardToolbarIconButtonClassName = cn(
  flashcardToolbarPillSurfaceClassName,
  "inline-flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground",
);

export const flashcardToolbarIconButtonActiveClassName =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-full border-0 bg-primary text-primary-foreground shadow-none hover:bg-primary/90";

export const flashcardToolbarToggleGroupClassName =
  "inline-flex shrink-0 flex-nowrap items-center gap-1.5";

export const flashcardToolbarSearchClassName = cn(
  flashcardToolbarPillSurfaceClassName,
  "w-full min-w-0 py-1 pr-3 pl-9 text-sm placeholder:text-muted-foreground md:text-sm",
);

export const flashcardToolbarFiltersGroupClassName =
  "flex shrink-0 flex-wrap items-center gap-2";

export const flashcardToolbarRowClassName =
  "flex w-full flex-wrap items-center justify-between gap-y-3";

export const flashcardToolbarSearchWrapClassName =
  "relative ml-auto w-full max-w-md shrink-0 sm:max-w-xl sm:w-96";
