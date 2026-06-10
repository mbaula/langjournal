"use client";

import type { ReactNode } from "react";

import { MarketingNav } from "@/components/marketing/marketing-nav";
import {
  marketingFlowBottomPaddingClassName,
  marketingFlowContentWidthClassName,
  marketingFlowTopPaddingClassName,
  marketingShellInsetClassName,
  marketingWatermarkClassName,
} from "@/components/marketing/marketing-flow-styles";
import { cn } from "@/lib/utils";

type MarketingFlowShellProps = {
  children: ReactNode;
  className?: string;
};

export function MarketingFlowShell({
  children,
  className,
}: MarketingFlowShellProps) {
  return (
    <div className={cn("flex min-h-dvh min-w-0 flex-col", className)}>
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
          <div className={cn(marketingFlowContentWidthClassName, "text-left")}>
            {children}
          </div>
        </main>

        <p className={marketingWatermarkClassName} aria-hidden>
          Folio
        </p>
      </section>
    </div>
  );
}
