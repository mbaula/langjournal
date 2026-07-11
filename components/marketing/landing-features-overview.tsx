import {
  Languages,
  Layers,
  LineChart,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { landingColoredSectionYClassName, landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

const featureIds = ["write", "translate", "practice", "track"] as const;

const featureIcons: Record<(typeof featureIds)[number], LucideIcon> = {
  write: NotebookPen,
  translate: Languages,
  practice: Layers,
  track: LineChart,
};

async function FeatureGrid() {
  const t = await getTranslations("marketing.featuresOverview");

  return (
    <div className="grid grid-cols-2 gap-[14px]">
      {featureIds.map((id, index) => {
        const Icon = featureIcons[id];
        return (
          <LandingReveal
            key={id}
            followScroll
            from="above"
            delayMs={index * 120}
          >
            <div className="flex h-full items-center justify-center gap-2 rounded-[18px] bg-background px-5 py-10 sm:px-6 sm:py-12">
              <Icon
                className="size-5 shrink-0 text-[#2C2C2C]/70 sm:size-[1.375rem]"
                strokeWidth={1.5}
              />
              <span className="font-sans text-base font-medium lowercase text-[#2C2C2C] sm:text-lg">
                {t(id)}
              </span>
            </div>
          </LandingReveal>
        );
      })}
    </div>
  );
}

export async function LandingFeaturesOverview() {
  const t = await getTranslations("marketing.featuresOverview");

  return (
    <section
      id="solution"
      className="scroll-mt-16 bg-[#D6DC82] text-[#262628]"
    >
      <div
        className={cn(
          "mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16",
          landingSectionXClassName,
          landingColoredSectionYClassName,
        )}
      >
        <LandingReveal>
          <h2 className="max-w-md font-[family-name:var(--font-folio)] text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            {t("title")}
          </h2>
          <p className="mt-6 max-w-md font-sans text-base leading-relaxed sm:text-[17px]">
            {t.rich("description", {
              highlight: (chunks) => (
                <span className="underline decoration-[#262628]/50 decoration-1 underline-offset-[3px]">
                  {chunks}
                </span>
              ),
            })}
          </p>
        </LandingReveal>

        <FeatureGrid />
      </div>
    </section>
  );
}
