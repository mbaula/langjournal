"use client";

import { useEffect, useRef, useState } from "react";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { cn } from "@/lib/utils";

type Scenario = {
  id: string;
  tag: string;
  quote: string;
};

const leftScenarios: Scenario[] = [
  {
    id: "rome",
    tag: "when travelling",
    quote:
      "This dish looks great, but I'm allergic to... wait, what's that word?",
  },
  {
    id: "home",
    tag: "when at home",
    quote:
      "At work, we're doing a type of... — wait, how do you say this?",
  },
  {
    id: "studying",
    tag: "when studying",
    quote:
      "The reading kept using this term for... actually, what's the word for it?",
  },
];

const rightScenarios: Scenario[] = [
  {
    id: "friends",
    tag: "when with friends",
    quote: "It's so funny because — wait, nvm, I forgot the word.",
  },
  {
    id: "traveling",
    tag: "when traveling",
    quote:
      "Can we get off at the... the stop before the airport? I forgot what it's called.",
  },
  {
    id: "texting",
    tag: "when texting",
    quote:
      "See you at that place on... ugh, you know the street — I lost the word.",
  },
];

/** Left and right alternate: L0, R0, L1, R1, L2, R2 */
const SEQUENCE = [
  { side: "left" as const, index: 0 },
  { side: "right" as const, index: 0 },
  { side: "left" as const, index: 1 },
  { side: "right" as const, index: 1 },
  { side: "left" as const, index: 2 },
  { side: "right" as const, index: 2 },
];

const SCROLL_VH_PER_STEP = 55;
const SECTION_HEIGHT_VH =
  100 + (SEQUENCE.length - 1) * SCROLL_VH_PER_STEP;

function getScenarioForStep(step: number): (Scenario & { side: "left" | "right" }) | null {
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
        "absolute top-[46%] block h-5 w-12 -translate-y-1/2 bg-background",
        side === "left"
          ? "-left-11 [clip-path:polygon(100%_0,100%_100%,0_50%)]"
          : "-right-11 [clip-path:polygon(0_0,0_100%,100%_50%)]",
      )}
      aria-hidden
    />
  );
}

function TypingScenarioBubble({
  scenario,
  side,
  stepProgress,
  stepKey,
}: {
  scenario: Scenario;
  side: "left" | "right";
  stepProgress: number;
  stepKey: number;
}) {
  const typingStart = 0.12;
  const typingEnd = 0.88;
  const typingRange = typingEnd - typingStart;
  const typingProgress =
    stepProgress <= typingStart
      ? 0
      : Math.min(1, (stepProgress - typingStart) / typingRange);

  const visibleChars = Math.max(
    0,
    Math.min(scenario.quote.length, Math.ceil(typingProgress * scenario.quote.length)),
  );
  const displayText = scenario.quote.slice(0, visibleChars);
  const isTyping =
    typingProgress > 0 && typingProgress < 1 && visibleChars < scenario.quote.length;
  const showTypingDots = stepProgress < typingStart;

  return (
    <div
      key={stepKey}
      className={cn(
        "landing-scenario-enter mx-auto flex w-full max-w-[16.5rem] flex-col sm:max-w-[17.5rem]",
        side === "left" ? "items-start" : "items-end text-right",
      )}
    >
      <p className="mb-2.5 font-sans text-[12px] font-medium lowercase tracking-normal text-[#2C2C2C]/40">
        {scenario.tag}
      </p>
      <div className="relative rounded-[1.35rem] bg-background px-4 py-3.5 shadow-[0_2px_12px_rgba(44,44,44,0.08)] sm:px-5 sm:py-4">
        <SpeechBubbleTail side={side} />
        <p className="min-h-[3.25rem] font-sans text-[15px] font-normal leading-[1.45] text-[#2C2C2C] sm:text-[16px]">
          {showTypingDots ? (
            <span className="landing-scenario-typing-dots inline-flex gap-1 py-0.5">
              <span />
              <span />
              <span />
            </span>
          ) : (
            <>
              {displayText}
              {isTyping ? (
                <span
                  className="landing-text-cursor ml-px inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-[#2C2C2C]/70 align-middle"
                  aria-hidden
                />
              ) : null}
            </>
          )}
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
) {
  const [step, setStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
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
      setStepProgress(1);
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
        setStepProgress(0);
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
      const nextStepProgress =
        nextStep >= SEQUENCE.length - 1 && progress >= 1
          ? 1
          : stepFloat - nextStep;

      setScrollProgress(progress);
      setStep(nextStep);
      setStepProgress(nextStepProgress);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [reducedMotion, sectionRef]);

  const activeScenario = getScenarioForStep(step);

  return { step, stepProgress, scrollProgress, activeScenario };
}

export function LandingUsers() {
  const sectionRef = useRef<HTMLElement>(null);
  const { step, stepProgress, scrollProgress, activeScenario } =
    useScrollScenarioProgress(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="who"
      className="relative scroll-mt-16 bg-background px-4 pb-4 pt-0 sm:px-6 sm:pb-6 md:px-8 md:pb-8"
      style={{ height: `${SECTION_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="relative mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none bg-marketing-hero-panel">
          <div className="flex flex-1 items-center px-5 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14 lg:px-12 lg:py-16">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-x-8 xl:gap-x-12">
              <div
                className={cn(
                  "order-2 lg:order-1 lg:pl-11 xl:pl-12",
                  activeScenario?.side !== "left" && "hidden lg:block",
                )}
              >
                <div
                  className={cn(
                    "relative flex min-h-[10rem] w-full items-center sm:min-h-[11rem]",
                    "justify-start",
                  )}
                >
                  {activeScenario?.side === "left" ? (
                    <TypingScenarioBubble
                      stepKey={step}
                      scenario={activeScenario}
                      side="left"
                      stepProgress={stepProgress}
                    />
                  ) : null}
                </div>
              </div>

              <LandingReveal className="order-1 mx-auto flex w-full max-w-[18rem] flex-col items-center text-center lg:order-2 lg:justify-self-center">
                <p className="font-sans text-[15px] leading-relaxed text-[#2C2C2C]/60 sm:text-base">
                  if you&apos;ve said this more than once...
                </p>

                <h2 className="mt-4 font-[family-name:var(--font-folio)] text-[clamp(1.875rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#2C2C2C]">
                  Wait, what&apos;s the word?
                </h2>

                <ScrollProgressLine progress={scrollProgress} />

                <p className="font-[family-name:var(--font-folio)] text-[clamp(1.375rem,2.75vw,2rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#2C2C2C]">
                  then folio is for you
                </p>
              </LandingReveal>

              <div
                className={cn(
                  "order-3 lg:pr-11 xl:pr-12",
                  activeScenario?.side !== "right" && "hidden lg:block",
                )}
              >
                <div
                  className={cn(
                    "relative flex min-h-[10rem] w-full items-center sm:min-h-[11rem]",
                    "justify-end",
                  )}
                >
                  {activeScenario?.side === "right" ? (
                    <TypingScenarioBubble
                      stepKey={step}
                      scenario={activeScenario}
                      side="right"
                      stepProgress={stepProgress}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div
            className="shrink-0 bg-marketing-hero-panel pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:pb-8 sm:pt-5"
            aria-hidden
          >
            <div className="mx-auto flex h-14 flex-col items-center justify-start gap-2 sm:h-16">
              <div className="h-6 w-px rounded-full bg-[#2C2C2C]/10 sm:h-8" />
              <div className="h-1.5 w-1.5 rounded-full bg-[#2C2C2C]/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
