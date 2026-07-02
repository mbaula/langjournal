import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  marketingHeroContentClassName,
  marketingHeroCtaClassName,
  marketingHeroEyebrowClassName,
  marketingHeroGridClassName,
  marketingHeroPanelClassName,
  marketingHeroSectionClassName,
  marketingHeroTitleClassName,
  marketingHeroTitleBrandClassName,
  marketingHeroDescriptionClassName,
} from "@/components/marketing/marketing-flow-styles";
import { SlashTranslateDemo } from "@/components/marketing/slash-translate-demo";
import { SlashTranslateDemoShell } from "@/components/marketing/slash-translate-demo-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function LandingHero() {
  const t = await getTranslations("marketing.hero");
  const tDemo = await getTranslations("marketing.demo");

  return (
    <section className={marketingHeroSectionClassName}>
      <div className={marketingHeroPanelClassName}>
        <div className={marketingHeroGridClassName}>
          <div className={marketingHeroContentClassName}>
            <p
              className={cn(
                marketingHeroEyebrowClassName,
                "landing-enter landing-enter-delay-1 mb-2 sm:mb-3",
              )}
            >
              {t("eyebrow")}
            </p>
            <h1
              className={cn(
                marketingHeroTitleClassName,
                "landing-enter landing-enter-delay-2",
              )}
            >
              <em className={marketingHeroTitleBrandClassName}>
                {t("titleBrand")}
              </em>{" "}
              {t("titleRest")}
            </h1>
            <p
              className={cn(
                marketingHeroDescriptionClassName,
                "landing-enter landing-enter-delay-3 mt-3 sm:mt-4",
              )}
            >
              {t("subtitle")}
            </p>

            <div className="landing-enter landing-enter-delay-4 mt-6 sm:mt-8">
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

            <div className="landing-enter landing-enter-delay-5 mt-10 w-fit max-w-full self-start text-left sm:mt-12 md:mt-14">
              <SlashTranslateDemoShell>
                <SlashTranslateDemo
                  variant="inline"
                  prefix={tDemo("prefix")}
                />
              </SlashTranslateDemoShell>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
