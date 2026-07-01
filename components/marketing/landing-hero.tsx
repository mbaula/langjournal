import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  marketingHeroCtaClassName,
  marketingHeroEyebrowClassName,
  marketingHeroGridClassName,
  marketingHeroPanelClassName,
  marketingHeroSectionClassName,
  marketingHeroTitleClassName,
} from "@/components/marketing/marketing-flow-styles";
import { SlashTranslateDemo } from "@/components/marketing/slash-translate-demo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function LandingHero() {
  const t = await getTranslations("marketing.hero");

  return (
    <section className={marketingHeroSectionClassName}>
      <div className={marketingHeroPanelClassName}>
        <div className={marketingHeroGridClassName}>
          <div className="relative z-10 flex w-full min-w-0 max-w-5xl flex-col items-center text-center">
            <p
              className={cn(
                marketingHeroEyebrowClassName,
                "landing-enter landing-enter-delay-1",
              )}
            >
              {t("eyebrow")}
            </p>
            <h1
              className={cn(
                marketingHeroTitleClassName,
                "landing-enter landing-enter-delay-2 whitespace-nowrap text-[clamp(1.5rem,4.5vw,3.875rem)]",
              )}
            >
              {t("title")}
            </h1>
            <div className="landing-enter landing-enter-delay-3 mt-5">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  marketingHeroCtaClassName,
                )}
              >
                {t("cta")}
                <ArrowUpRight className="size-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          <div className="landing-enter landing-enter-delay-4 relative z-10 w-full max-w-lg">
            <SlashTranslateDemo className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
