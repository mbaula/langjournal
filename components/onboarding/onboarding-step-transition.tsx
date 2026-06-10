"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type OnboardingStepDirection = "forward" | "back";

type OnboardingStepTransitionProps = {
  step: number;
  direction: OnboardingStepDirection;
  children: ReactNode;
  className?: string;
};

export function OnboardingStepTransition({
  step,
  direction,
  children,
  className,
}: OnboardingStepTransitionProps) {
  return (
    <div
      key={step}
      className={cn(
        "onboarding-step-panel",
        direction === "forward"
          ? "onboarding-step-forward"
          : "onboarding-step-back",
        className,
      )}
    >
      {children}
    </div>
  );
}
