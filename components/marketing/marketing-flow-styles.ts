/** Shared horizontal inset for marketing pages. */
export const marketingShellInsetClassName = "px-4 sm:px-6 lg:px-8";

/** Top padding for auth flows — ~25% viewport below the nav, capped on tall screens. */
export const marketingFlowTopPaddingClassName =
  "pt-[min(25vh,10rem)]";

/** Bottom padding leaving room for the Folio watermark. */
export const marketingFlowBottomPaddingClassName =
  "pb-16 sm:pb-20 lg:pb-24";

/** Auth flow content column — between compact and full marketing width. */
export const marketingFlowContentWidthClassName =
  "w-full min-w-0 max-w-sm sm:max-w-md";

/** Faint Folio wordmark anchored to the section bottom. */
export const marketingWatermarkClassName =
  "pointer-events-none absolute inset-x-4 bottom-4 z-0 mx-auto max-w-6xl select-none font-[family-name:var(--font-folio)] text-[clamp(2.75rem,14vw,9rem)] font-semibold leading-none tracking-[-0.04em] text-foreground/[0.06] sm:inset-x-6 sm:bottom-6 lg:inset-x-8";

/** Landing hero grid — stacks on mobile, splits from md up. */
export const marketingHeroGridClassName =
  "relative mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 items-start gap-8 px-4 py-14 sm:gap-10 sm:px-6 sm:py-16 md:min-h-[min(88vh,52rem)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:gap-8 md:py-24 lg:gap-10 lg:px-8 lg:py-28";

/** Shared typography and field styles for login + onboarding flows. */
export const marketingFlowEyebrowClassName =
  "text-[11px] font-medium uppercase tracking-[0.2em] text-sidebar-primary";

export const marketingFlowTitleClassName =
  "max-w-2xl font-[family-name:var(--font-folio)] text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground";

export const marketingFlowDescriptionClassName =
  "mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base";

export const marketingFlowFieldClassName =
  "h-12 w-full rounded-full border border-border/80 bg-background/80 px-5 text-left text-[15px] text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 focus:border-sidebar-primary/30 focus:bg-background focus:ring-2 focus:ring-sidebar-primary/15";

export const marketingFlowNavButtonClassName =
  "text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground";
