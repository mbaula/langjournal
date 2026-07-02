import { folioWordmarkClassName } from "@/components/journal/field-styles";
import { cn } from "@/lib/utils";

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
export const marketingWatermarkClassName = cn(
  "pointer-events-none absolute inset-x-4 bottom-4 z-0 mx-auto max-w-6xl select-none leading-none sm:inset-x-6 sm:bottom-6 lg:inset-x-8",
  folioWordmarkClassName,
  "text-[clamp(2.75rem,14vw,9rem)] text-foreground/[0.06]",
);

/** White outer frame around the landing hero panel. */
export const marketingHeroSectionClassName =
  "flex min-h-[calc(100dvh-3.5rem)] flex-col bg-background pt-0 px-4 pb-4 sm:min-h-[calc(100dvh-4rem)] sm:px-6 sm:pb-6 md:px-8 md:pb-8";

/** Tinted hero panel — brand purple on marketing. */
export const marketingHeroPanelClassName =
  "relative mx-auto flex w-full flex-1 flex-col justify-center rounded-none bg-marketing-hero-panel px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12";

/** Landing hero — centers the content column in the panel. */
export const marketingHeroGridClassName =
  "relative flex w-full flex-col items-center justify-center";

/** Shared width + alignment for hero copy, CTA, and demo. */
export const marketingHeroContentClassName =
  "relative z-10 flex w-full min-w-0 max-w-[min(100%,36rem)] flex-col items-center text-center sm:max-w-[38rem]";

/** White demo card inside the hero panel. */
export const marketingDemoShellClassName =
  "relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/50 bg-background px-4 py-5 sm:px-5 sm:py-6";

export const marketingDemoWindowTitleClassName =
  "ml-2 text-xs font-medium text-muted-foreground sm:text-[13px]";

/** White outer frame for auth flows (matches landing hero frame). */
export const marketingFlowFrameClassName =
  "flex flex-1 flex-col bg-background px-4 pb-4 pt-0 sm:px-6 sm:pb-6 md:px-8 md:pb-8";

/** Purple panel for auth flows. */
export const marketingFlowPanelClassName =
  "relative mx-auto flex w-full flex-1 flex-col justify-center rounded-none bg-marketing-hero-panel px-5 py-12 sm:px-8 sm:py-16 md:px-10 md:py-20";

/** Centered auth content column. */
export const marketingFlowPanelContentClassName =
  "mx-auto w-full max-w-md text-center";

/** Card on purple panel for forms. */
export const marketingFlowCardClassName =
  "rounded-2xl border border-border/80 bg-background px-5 py-6 text-left sm:px-6 sm:py-7";

/** Landing hero — serif display headline. */
export const marketingHeroEyebrowClassName =
  "font-sans text-base font-medium tracking-normal text-[#262628] sm:text-[17px]";

/** Shared typography and field styles for login + onboarding flows. */
export const marketingFlowEyebrowClassName = marketingHeroEyebrowClassName;

export const marketingFlowTitleClassName =
  "max-w-2xl font-[family-name:var(--font-folio)] text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground";

export const marketingFlowDescriptionClassName =
  "mt-3 max-w-lg font-sans text-[15px] leading-relaxed text-muted-foreground sm:text-base";

export const marketingHeroTitleClassName =
  "text-balance font-[family-name:var(--font-folio)] text-[clamp(1.5rem,6.5vw,3.375rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#262628] sm:whitespace-nowrap sm:text-[clamp(1.75rem,4.2vw,3.375rem)]";

export const marketingHeroTitleBrandClassName =
  "font-[family-name:var(--font-folio)] text-[1.1em] font-normal italic";

export const marketingHeroCtaClassName =
  "h-12 rounded-full border-0 bg-[#262628] px-7 text-[15px] text-white shadow-none hover:bg-[#262628]/90 [a]:hover:bg-[#262628]/90 focus-visible:border-transparent focus-visible:ring-[#262628]/30";

export const marketingNavCtaClassName =
  "h-9 rounded-full border-0 bg-[#262628] px-4 text-[13px] text-white shadow-none hover:bg-[#262628]/90 [a]:hover:bg-[#262628]/90 focus-visible:border-transparent focus-visible:ring-[#262628]/30";

export const marketingNavLinkClassName =
  "rounded-md px-2 py-1.5 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-base";

export const marketingHeroDescriptionClassName =
  "text-balance max-w-[24rem] font-sans text-[17px] leading-[1.58] text-[#262628]/82 sm:max-w-[30rem] sm:text-lg sm:leading-[1.62]";

export const marketingFlowFieldClassName =
  "h-12 w-full rounded-full border border-border/80 bg-background/80 px-5 text-left text-[15px] text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 focus:border-sidebar-primary/30 focus:bg-background focus:ring-2 focus:ring-sidebar-primary/15";

export const marketingFlowNavButtonClassName =
  "text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground";
