"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTHLY_MAX = 20;
const LIFETIME_MAX = 150;

function getPriceReaction(
  value: number,
  variant: "monthly" | "lifetime",
): string {
  if (variant === "monthly") {
    if (value === 0) return "think about the children";
    if (value <= 2) return "i see shin ramen in my future";
    if (value <= 5) return "I appreciate you <3";
    if (value < 20) return "I APPRECIATE you <3";
    return "pls marry me.";
  }

  if (value === 0) return "think about the children";
  if (value <= 25) return "i see shin ramen in my future";
  if (value <= 60) return "I appreciate you <3";
  if (value <= 100) return "I APPRECIATE you <3";
  return "pls marry me.";
}

type PriceSliderProps = {
  id: string;
  label: string;
  value: number;
  max: number;
  step: number;
  suffix: string;
  variant: "monthly" | "lifetime";
  onChange: (value: number) => void;
};

function PriceSlider({
  id,
  label,
  value,
  max,
  step,
  suffix,
  variant,
  onChange,
}: PriceSliderProps) {
  const [touched, setTouched] = useState(false);
  const reaction = getPriceReaction(value, variant);

  return (
    <div className="rounded-2xl border border-border/80 bg-background p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[15px] font-medium text-foreground">
          {label}
        </label>
        <p className="font-[family-name:var(--font-folio)] text-2xl font-semibold tracking-[-0.03em] text-foreground">
          ${value}
          <span className="text-[13px] font-normal text-muted-foreground">
            {suffix}
          </span>
        </p>
      </div>

      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          setTouched(true);
          onChange(Number(e.target.value));
        }}
        className="pricing-slider mt-5 w-full"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`$${value}${suffix}`}
      />

      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>$0</span>
        <span>${max}</span>
      </div>

      {touched ? (
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          &ldquo;{reaction}&rdquo;
        </p>
      ) : null}
    </div>
  );
}

export function PricingFeedback() {
  const [monthly, setMonthly] = useState(5);
  const [lifetime, setLifetime] = useState(49);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <p className="mx-auto max-w-xl text-center text-base leading-relaxed text-muted-foreground sm:text-[17px]">
        We&apos;re a team of two, a designer and an engineer, and we&apos;re
        honestly not sure what to charge yet. How much would{" "}
        <span className="text-foreground">you</span> pay?
      </p>
      <p className="mx-auto mt-3 max-w-xl text-center text-[13px] text-muted-foreground">
        Don&apos;t worry — your answers are anonymous.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <PriceSlider
          id="monthly-price"
          label="Monthly"
          value={monthly}
          max={MONTHLY_MAX}
          step={1}
          suffix="/mo"
          variant="monthly"
          onChange={setMonthly}
        />
        <PriceSlider
          id="lifetime-price"
          label="One-time"
          value={lifetime}
          max={LIFETIME_MAX}
          step={5}
          suffix=" once"
          variant="lifetime"
          onChange={setLifetime}
        />
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        {submitted ? (
          <p className="text-center text-[14px] text-foreground">
            Thank you — this genuinely helps us figure it out.
          </p>
        ) : (
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 rounded-full px-5 text-[13px]",
            )}
            onClick={() => setSubmitted(true)}
          >
            Send your answer
          </button>
        )}
        <p className="text-center text-[12px] text-muted-foreground">
          Folio is free during beta. No card required to start.
        </p>
      </div>
    </div>
  );
}
