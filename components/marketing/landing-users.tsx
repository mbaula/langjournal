"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { cn } from "@/lib/utils";

type Scenario = {
  id: string;
  tag: string;
  quote: string;
};

const leftScenarioIds = ["rome", "home", "studying"] as const;
const rightScenarioIds = ["friends", "traveling", "texting"] as const;

/** Left and right alternate: L0, R0, L1 — first three scenarios only */
const SEQUENCE = [
  { side: "left" as const, index: 0 },
  { side: "right" as const, index: 0 },
  { side: "left" as const, index: 1 },
];

const SCROLL_VH_PER_STEP = 55;
const SECTION_HEIGHT_VH =
  100 + (SEQUENCE.length - 1) * SCROLL_VH_PER_STEP;

function useScenarios() {
  const t = useTranslations("marketing.users.scenarios");

  const leftScenarios: Scenario[] = leftScenarioIds.map((id) => ({
    id,
    tag: t(`${id}Tag`),
    quote: t(`${id}Quote`),
  }));

  const rightScenarios: Scenario[] = rightScenarioIds.map((id) => ({
    id,
    tag: t(`${id}Tag`),
    quote: t(`${id}Quote`),
  }));

  return { leftScenarios, rightScenarios };
}

function getScenarioForStep(
  step: number,
  leftScenarios: Scenario[],
  rightScenarios: Scenario[],
): (Scenario & { side: "left" | "right" }) | null {
  const item = SEQUENCE[step];
  if (!item) return null;

  const scenario =
    item.side === "left"
      ? leftScenarios[item.index]
      : rightScenarios[item.index];

  if (!scenario) return null;
  return { ...scenario, side: item.side };
}

function SpeechBubbleTail({ side }: { side: "left" | "right" }) {
  return (
    <span
      className={cn(
        "absolute top-[46%] hidden h-5 w-12 -translate-y-1/2 bg-background sm:block",
        side === "left"
          ? "-left-11 [clip-path:polygon(100%_0,100%_100%,0_50%)]"
          : "-right-11 [clip-path:polygon(0_0,0_100%,100%_50%)]",
      )}
      aria-hidden
    />
  );
}

function ScenarioBubble({
  scenario,
  side,
  stepKey,
}: {
  scenario: Scenario;
  side: "left" | "right";
  stepKey: number;
}) {
  return (
    <div
      key={stepKey}
      className={cn(
        "landing-scenario-enter mx-auto flex w-full max-w-[min(100%,16.5rem)] flex-col sm:max-w-[17.5rem]",
        side === "left" ? "items-start" : "items-end text-right",
      )}
    >
      <p className="mb-2.5 font-sans text-[12px] font-medium lowercase tracking-normal text-[#2C2C2C]/40">
        {scenario.tag}
      </p>
      <div className="relative rounded-[1.35rem] bg-background px-4 py-3.5 shadow-[0_2px_12px_rgba(44,44,44,0.08)] sm:px-5 sm:py-4">
        <SpeechBubbleTail side={side} />
        <p className="font-sans text-[15px] font-normal leading-[1.45] text-[#2C2C2C] sm:text-[16px]">
          {scenario.quote}
        </p>
      </div>
    </div>
  );
}

function ScrollProgressLine({ progress }: { progress: number }) {
  const fillPercent = Math.min(100, Math.max(0, progress * 100));

  return (
    <div
      className="relative my-6 h-36 w-1.5 overflow-hidden rounded-full bg-[#2C2C2C]/10 sm:my-8 sm:h-44 sm:w-2 lg:h-52"
      aria-hidden
    >
      <div
        className="absolute inset-x-0 top-0 rounded-full bg-[#2C2C2C]/28 transition-[height] duration-150 ease-out"
        style={{ height: `${fillPercent}%` }}
      />
    </div>
  );
}

function useScrollScenarioProgress(
  sectionRef: React.RefObject<HTMLElement | null>,
  leftScenarios: Scenario[],
  rightScenarios: Scenario[],
) {
  const [step, setStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setStep(SEQUENCE.length - 1);
      setScrollProgress(1);
      return;
    }

    const section = sectionRef.current;
    if (!section) return;

    const updateProgress = () => {
      const rect = section.getBoundingClientRect();
      const scrollRange = section.offsetHeight - window.innerHeight;

      if (scrollRange <= 0) {
        setStep(0);
        setScrollProgress(0);
        return;
      }

      const scrolled = Math.min(scrollRange, Math.max(0, -rect.top));
      const progress = scrolled / scrollRange;
      const stepFloat = progress * SEQUENCE.length;
      const nextStep = Math.min(
        SEQUENCE.length - 1,
        Math.max(0, Math.floor(stepFloat)),
      );

      setScrollProgress(progress);
      setStep(nextStep);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [reducedMotion, sectionRef]);

  const activeScenario = getScenarioForStep(
    step,
    leftScenarios,
    rightScenarios,
  );

  return { step, scrollProgress, activeScenario };
}

export function LandingUsers() {
  const t = useTranslations("marketing.users");
  const sectionRef = useRef<HTMLElement>(null);
  const { leftScenarios, rightScenarios } = useScenarios();
  const { step, scrollProgress, activeScenario } = useScrollScenarioProgress(
    sectionRef,
    leftScenarios,
    rightScenarios,
  );

  return (
    <section
      ref={sectionRef}
      id="who"
      className="relative scroll-mt-16 bg-background px-4 pb-4 pt-0 sm:px-6 sm:pb-6 md:px-8 md:pb-8"
      style={{ height: `${SECTION_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 flex min-h-dvh flex-col">
        <div className="relative mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none bg-marketing-hero-panel">
          <div className="flex flex-1 items-center px-5 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14 lg:px-12 lg:py-16">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-x-8 xl:gap-10">
              <div
                className={cn(
                  "order-2 lg:order-1 lg:pl-11 xl:pl-12",
                  activeScenario?.side !== "left" && "hidden",
                )}
              >
                <div
                  className={cn(
                    "relative flex w-full items-center justify-center lg:min-h-[10rem] lg:justify-start xl:min-h-[11rem]",
                  )}
                >
                  {activeScenario?.side === "left" ? (
                    <ScenarioBubble
                      stepKey={step}
                      scenario={activeScenario}
                      side="left"
                    />
                  ) : null}
                </div>
              </div>

              <LandingReveal className="order-1 mx-auto flex w-full max-w-[18rem] min-w-0 flex-col items-center text-center sm:max-w-[20rem] lg:order-2 lg:justify-self-center">
                <p className="font-sans text-[15px] leading-relaxed text-[#2C2C2C]/60 sm:text-base">
                  {t("intro")}
                </p>

                <h2 className="mt-4 font-[family-name:var(--font-folio)] text-[clamp(1.875rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#2C2C2C]">
                  {t("headline")}
                </h2>

                <ScrollProgressLine progress={scrollProgress} />

                <p className="font-[family-name:var(--font-folio)] text-[clamp(1.375rem,2.75vw,2rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#2C2C2C]">
                  {t("closing")}
                </p>
              </LandingReveal>

              <div
                className={cn(
                  "order-3 lg:pr-11 xl:pr-12",
                  activeScenario?.side !== "right" && "hidden",
                )}
              >
                <div
                  className={cn(
                    "relative flex w-full items-center justify-center lg:min-h-[10rem] lg:justify-end xl:min-h-[11rem]",
                  )}
                >
                  {activeScenario?.side === "right" ? (
                    <ScenarioBubble
                      stepKey={step}
                      scenario={activeScenario}
                      side="right"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
