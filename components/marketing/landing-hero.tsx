import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import {
  marketingHeroGridClassName,
  marketingWatermarkClassName,
} from "@/components/marketing/marketing-flow-styles";
import { SlashTranslateDemo } from "@/components/marketing/slash-translate-demo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,color-mix(in_oklab,var(--sidebar-primary)_8%,transparent),transparent_55%)]"
        aria-hidden
      />

      <div className={marketingHeroGridClassName}>
        <div className="relative z-10 w-full min-w-0 self-start md:max-w-[34rem] md:self-center">
          <p className="landing-enter landing-enter-delay-1 mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-sidebar-primary">
            Daily language journal
          </p>
          <h1 className="landing-enter landing-enter-delay-2 max-w-[14ch] font-[family-name:var(--font-folio)] text-[clamp(2.375rem,7.5vw,5.25rem)] font-semibold leading-[0.92] tracking-[-0.03em] text-foreground">
            Learn languages through journaling.
          </h1>
          <p className="landing-enter landing-enter-delay-3 mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Tired of getting stuck on words? We're here to help.
          </p>
          <div className="landing-enter landing-enter-delay-4 mt-7">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full px-6 text-[15px] shadow-sm",
              )}
            >
              Try our beta for free
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="landing-enter landing-enter-delay-5 relative z-10 w-full min-w-0 self-start md:w-4/5 md:justify-self-end md:self-center">
          <SlashTranslateDemo variant="hero" />
        </div>
      </div>

      <p
        className={cn(
          marketingWatermarkClassName,
          "landing-enter landing-enter-delay-5 bottom-6 sm:bottom-8",
          "text-[clamp(3rem,16vw,11rem)]",
        )}
        aria-hidden
      >
        Folio
      </p>
    </section>
  );
}
