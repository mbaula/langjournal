import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { marketingHeroCtaClassName } from "@/components/marketing/marketing-flow-styles";
import { landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function LandingJoinCta() {
  const t = await getTranslations("marketing.joinCta");

  return (
    <section className="bg-background">
      <div
        className={cn(
          "mx-auto flex max-w-6xl justify-center",
          landingSectionXClassName,
        )}
      >
        <LandingReveal>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              marketingHeroCtaClassName,
            )}
          >
            {t("label")}
            <ArrowUpRight className="size-4" strokeWidth={1.5} />
          </Link>
        </LandingReveal>
      </div>
    </section>
  );
}
