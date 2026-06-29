import type { ReactNode } from "react";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

type FeatureCardConfig = {
  id: string;
  title: string;
  description: ReactNode;
  bgColor: string;
  textPosition: "top" | "bottom";
};

const featureCards: FeatureCardConfig[] = [
  {
    id: "write",
    title: "Write",
    description: (
      <>
        Practice your writing with{" "}
        <strong className="font-semibold">prompts built for your level</strong>,
        from A1 to C2.
      </>
    ),
    bgColor: "#F7BDB2",
    textPosition: "top",
  },
  {
    id: "translate",
    title: "Translate",
    description: (
      <>
        Stop opening a thousand apps.{" "}
        <strong className="font-semibold">Find words you need</strong> right
        inside Folio.
      </>
    ),
    bgColor: "#C6C3F2",
    textPosition: "top",
  },
  {
    id: "practice",
    title: "Practice",
    description: (
      <>
        Folio automatically saves your{" "}
        <strong className="font-semibold">new words into flashcards</strong>,
        so you can practice!
      </>
    ),
    bgColor: "#FFE790",
    textPosition: "bottom",
  },
  {
    id: "track",
    title: "Track",
    description: (
      <>
        Watch your streak, your words, and{" "}
        <strong className="font-semibold">your progress grow</strong> over time.
      </>
    ),
    bgColor: "#9FCEE4",
    textPosition: "bottom",
  },
];

function FeatureCard({
  title,
  description,
  bgColor,
  textPosition,
}: Omit<FeatureCardConfig, "id">) {
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

export function LandingFeaturesDetail() {
  return (
    <section className="bg-background">
      <div
        className={cn(
          "mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5",
          landingSectionXClassName,
        )}
      >
        {featureCards.map((card, index) => (
          <LandingReveal
            key={card.id}
            className="h-full"
            from="below"
            delayMs={index * 100}
          >
            <FeatureCard {...card} />
          </LandingReveal>
        ))}
      </div>
    </section>
  );
}
