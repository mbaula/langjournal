import { getTranslations } from "next-intl/server";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

const featureCardIds = ["write", "translate", "practice", "track"] as const;

const featureCardStyles: Record<
  (typeof featureCardIds)[number],
  { bgColor: string; textPosition: "top" | "bottom" }
> = {
  write: { bgColor: "#F7BDB2", textPosition: "top" },
  translate: { bgColor: "#C6C3F2", textPosition: "top" },
  practice: { bgColor: "#FFE790", textPosition: "bottom" },
  track: { bgColor: "#9FCEE4", textPosition: "bottom" },
};

type FeatureCardProps = {
  title: string;
  description: React.ReactNode;
  bgColor: string;
  textPosition: "top" | "bottom";
};

function FeatureCard({
  title,
  description,
  bgColor,
  textPosition,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "flex min-h-[11rem] flex-col rounded-[24px] p-6 sm:min-h-[12rem] sm:p-8",
        textPosition === "bottom" && "justify-end",
      )}
      style={{ backgroundColor: bgColor }}
    >
      <div>
        <h3 className="font-[family-name:var(--font-folio)] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-[#2C2C2C]">
          {title}
        </h3>
        <p className="mt-3 max-w-sm font-sans text-[15px] leading-relaxed text-[#2C2C2C]/90 sm:text-base">
          {description}
        </p>
      </div>
    </article>
  );
}

export async function LandingFeaturesDetail() {
  const t = await getTranslations("marketing.featuresDetail");

  return (
    <section className="bg-background">
      <div
        className={cn(
          "mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5",
          landingSectionXClassName,
        )}
      >
        {featureCardIds.map((id, index) => {
          const style = featureCardStyles[id];
          return (
            <LandingReveal
              key={id}
              className="h-full"
              from="below"
              delayMs={index * 100}
            >
              <FeatureCard
                title={t(`${id}Title`)}
                description={t.rich(`${id}Description`, {
                  strong: (chunks) => (
                    <strong className="font-semibold">{chunks}</strong>
                  ),
                })}
                bgColor={style.bgColor}
                textPosition={style.textPosition}
              />
            </LandingReveal>
          );
        })}
      </div>
    </section>
  );
}
