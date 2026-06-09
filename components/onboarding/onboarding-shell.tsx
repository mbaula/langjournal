"use client";

import type { ReactNode } from "react";

import { MarketingNav } from "@/components/marketing/marketing-nav";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  marketingFlowBottomPaddingClassName,
  marketingFlowContentWidthClassName,
  marketingFlowTopPaddingClassName,
  marketingShellInsetClassName,
  marketingWatermarkClassName,
} from "@/components/marketing/marketing-flow-styles";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  step?: number;
  questionCount?: number;
  showProgress?: boolean;
  wideContent?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  error?: string | null;
};

export function OnboardingShell({
  step = 1,
  questionCount = 3,
  showProgress = true,
  wideContent = false,
  children,
  footer,
  error,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col bg-background text-foreground">
      <MarketingNav />

      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <main
          className={cn(
            "relative z-10 mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col items-start justify-start",
            marketingShellInsetClassName,
            marketingFlowTopPaddingClassName,
            marketingFlowBottomPaddingClassName,
          )}
        >
          <div
            className={cn(
              "w-full min-w-0 text-left",
              wideContent
                ? "max-w-sm sm:max-w-lg"
                : marketingFlowContentWidthClassName,
            )}
          >
            {showProgress ? (
              <OnboardingProgress step={step} total={questionCount} />
            ) : null}
            {children}
            {footer ? (
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                {footer}
              </div>
            ) : null}
            {error ? (
              <p className="mt-4 text-[13px] text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </main>

        <p className={marketingWatermarkClassName} aria-hidden>
          Folio
        </p>
      </section>
    </div>
  );
}
