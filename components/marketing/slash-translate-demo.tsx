"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { journalEditorTranslationHighlightClassName } from "@/components/journal/field-styles";
import { cn } from "@/lib/utils";

type DemoScenario = {
  id: string;
  slashSource: string;
  translation: string;
  slashHint: string;
};

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "es",
    slashSource: "//a mitad de frase!",
    translation: "mid-sentence!",
    slashHint: "a mitad de frase!",
  },
  {
    id: "fr",
    slashSource: "//milieu de phrase!",
    translation: "mid-sentence!",
    slashHint: "milieu de phrase!",
  },
  {
    id: "zh",
    slashSource: "//句中!",
    translation: "mid-sentence!",
    slashHint: "句中!",
  },
  {
    id: "vi",
    slashSource: "//giữa câu!",
    translation: "mid-sentence!",
    slashHint: "giữa câu!",
  },
  {
    id: "ja",
    slashSource: "//文中!",
    translation: "mid-sentence!",
    slashHint: "文中!",
  },
  {
    id: "hi",
    slashSource: "//वाक्य के बीच!",
    translation: "mid-sentence!",
    slashHint: "वाक्य के बीच!",
  },
];

const CHAR_MS = 68;
const TYPED_HOLD_MS = 1600;
const TRANSLATED_HOLD_MS = 2800;
const RESET_MS = 800;

type DemoPhase = "slash" | "hold" | "done";

type SlashTranslateDemoProps = {
  variant?: "default" | "hero" | "compact";
  className?: string;
};

export function SlashTranslateDemo({
  variant = "default",
  className,
}: SlashTranslateDemoProps) {
  const t = useTranslations("marketing.demo");
  const isEmbedded = variant === "hero" || variant === "compact";
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("slash");
  const [slashLen, setSlashLen] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const scenario = DEMO_SCENARIOS[scenarioIndex]!;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setPhase("slash");
    setSlashLen(0);
  }, [scenarioIndex]);

  useEffect(() => {
    if (reducedMotion) {
      setPhase("done");
      setSlashLen(0);
      return;
    }

    if (phase === "slash") {
      if (slashLen >= scenario.slashSource.length) {
        setPhase("hold");
        return;
      }
      const t = window.setTimeout(() => setSlashLen((n) => n + 1), CHAR_MS);
      return () => window.clearTimeout(t);
    }

    if (phase === "hold") {
      const t = window.setTimeout(() => setPhase("done"), TYPED_HOLD_MS);
      return () => window.clearTimeout(t);
    }

    if (phase === "done") {
      const t = window.setTimeout(() => {
        setScenarioIndex((i) => (i + 1) % DEMO_SCENARIOS.length);
      }, TRANSLATED_HOLD_MS + RESET_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase, slashLen, reducedMotion, scenario]);

  const slashText = scenario.slashSource.slice(0, slashLen);
  const showCursor = !reducedMotion && phase === "slash";

  const demoText = (
    <p
      dir="auto"
      className={cn(
        "max-w-sm font-sans antialiased sm:max-w-md",
        isEmbedded
          ? "text-base leading-relaxed text-muted-foreground/70 sm:text-lg"
          : "text-base leading-[1.65] text-muted-foreground/70",
      )}
    >
      {t("prefix")}
      {phase === "done" ? (
        <mark
          className={journalEditorTranslationHighlightClassName}
          title={scenario.slashHint}
        >
          {scenario.translation}
        </mark>
      ) : slashText ? (
        <mark className={journalEditorTranslationHighlightClassName}>
          {slashText}
        </mark>
      ) : null}
      {showCursor ? (
        <span
          className="ml-px inline-block h-[1.1em] w-px translate-y-px animate-[slash-demo-cursor_1s_ease-in-out_infinite] bg-muted-foreground/40"
          aria-hidden
        />
      ) : null}
    </p>
  );

  if (isEmbedded) {
    return (
      <div
        className={cn(
          "relative z-[1] flex w-full flex-col items-center text-center",
          className,
        )}
      >
        {demoText}
      </div>
    );
  }

  return (
    <div className={cn("flex w-fit max-w-full flex-col", className)}>
      <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <span className="size-2 rounded-full bg-sidebar-primary/40" />
          <span className="size-2 rounded-full bg-sidebar-primary/25" />
          <span className="size-2 rounded-full bg-sidebar-primary/15" />
          <span className="ml-2 text-[11px] font-medium text-muted-foreground">
            {t("windowTitle")}
          </span>
        </div>

        <div className="p-4 sm:p-5">{demoText}</div>
      </div>
    </div>
  );
}
