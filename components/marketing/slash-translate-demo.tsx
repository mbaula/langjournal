"use client";

import { useEffect, useState } from "react";

import { journalEditorTranslationHighlightClassName } from "@/components/journal/field-styles";
import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";
import { cn } from "@/lib/utils";

type DemoScenario = {
  id: string;
  sourceLang: string;
  targetLang: string;
  title: string;
  prefix: string;
  slashSource: string;
  translation: string;
  slashHint: string;
};

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "fr",
    sourceLang: "English",
    targetLang: "French",
    title: "Un matin tranquille",
    prefix: "Ce matin, ",
    slashSource: "// good morning",
    translation: "bonjour",
    slashHint: "good morning",
  },
  {
    id: "ja",
    sourceLang: "English",
    targetLang: "Japanese",
    title: "静かな朝",
    prefix: "今朝、",
    slashSource: "// nice weather",
    translation: "いい天気",
    slashHint: "nice weather",
  },
  {
    id: "ar",
    sourceLang: "English",
    targetLang: "Arabic",
    title: "صباح هادئ",
    prefix: "هذا الصباح، ",
    slashSource: "// good morning",
    translation: "صباح الخير",
    slashHint: "good morning",
  },
];

const MORE_LANGUAGES_COUNT = FALLBACK_LANGUAGES.length - DEMO_SCENARIOS.length;

const CHAR_MS = 44;
const ENTER_HOLD_MS = 1400;
const TRANSLATED_HOLD_MS = 1200;
const RESET_MS = 200;

type DemoPhase = "prefix" | "slash" | "enter" | "done";

type SlashTranslateDemoProps = {
  variant?: "default" | "hero" | "compact";
  translateTriggerKey?: string;
};

export function SlashTranslateDemo({
  variant = "default",
  translateTriggerKey = "Enter",
}: SlashTranslateDemoProps) {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("prefix");
  const [prefixLen, setPrefixLen] = useState(0);
  const [slashLen, setSlashLen] = useState(0);
  const [showEnter, setShowEnter] = useState(false);
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
    setPhase("prefix");
    setPrefixLen(0);
    setSlashLen(0);
    setShowEnter(false);
  }, [scenarioIndex]);

  useEffect(() => {
    if (reducedMotion) {
      setPhase("done");
      setPrefixLen(scenario.prefix.length);
      setSlashLen(0);
      setShowEnter(false);
      return;
    }

    if (phase === "prefix") {
      if (prefixLen >= scenario.prefix.length) {
        setPhase("slash");
        return;
      }
      const t = window.setTimeout(() => setPrefixLen((n) => n + 1), CHAR_MS);
      return () => window.clearTimeout(t);
    }

    if (phase === "slash") {
      if (slashLen >= scenario.slashSource.length) {
        setPhase("enter");
        setShowEnter(true);
        return;
      }
      const t = window.setTimeout(() => setSlashLen((n) => n + 1), CHAR_MS);
      return () => window.clearTimeout(t);
    }

    if (phase === "enter") {
      const t = window.setTimeout(() => {
        setShowEnter(false);
        setPhase("done");
      }, ENTER_HOLD_MS);
      return () => window.clearTimeout(t);
    }

    if (phase === "done") {
      const t = window.setTimeout(() => {
        setScenarioIndex((i) => (i + 1) % DEMO_SCENARIOS.length);
      }, TRANSLATED_HOLD_MS + RESET_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase, prefixLen, slashLen, reducedMotion, scenario]);

  const prefixText = scenario.prefix.slice(0, prefixLen);
  const slashText = scenario.slashSource.slice(0, slashLen);
  const showCursor = !reducedMotion && phase !== "done";

  return (
    <div className={cn("flex flex-col", (isHero || isCompact) && "w-full")}>
      <div
        className={cn(
          "mb-3 flex flex-wrap gap-1.5",
          isHero && "mb-4 gap-2",
          isCompact && "mb-2.5 gap-1",
        )}
        aria-label="Languages shown in demo"
      >
        {DEMO_SCENARIOS.map((item, index) => (
          <span
            key={item.id}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors sm:text-[11px]",
              isHero && "px-3 py-1 text-[11px] sm:text-[12px]",
              isCompact && "px-2 py-0.5 text-[10px]",
              index === scenarioIndex
                ? "border-sidebar-primary/30 bg-sidebar-primary text-sidebar-primary-foreground"
                : "border-border/80 bg-background/80 text-muted-foreground",
            )}
          >
            {item.targetLang}
          </span>
        ))}
        {!isCompact ? (
          <span
            className={cn(
              "rounded-full border border-dashed border-border/80 bg-background/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-[11px]",
              isHero && "px-3 py-1 text-[11px] sm:text-[12px]",
            )}
          >
            + {MORE_LANGUAGES_COUNT} more!
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm",
          isHero && "rounded-[1.25rem] shadow-md ring-1 ring-border/40",
          isCompact && "rounded-xl shadow-none",
        )}
      >
        {!isHero && !isCompact ? (
          <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
            <span className="size-2 rounded-full bg-sidebar-primary/40" />
            <span className="size-2 rounded-full bg-sidebar-primary/25" />
            <span className="size-2 rounded-full bg-sidebar-primary/15" />
            <span className="ml-2 text-[11px] font-medium text-muted-foreground">
              Folio — Journal entry
            </span>
          </div>
        ) : null}

        <div
          className={cn(
            "space-y-3",
            isHero ? "space-y-4 p-4 sm:p-5 lg:p-6" : "space-y-4 p-4 sm:p-5",
            isCompact && "space-y-2.5 p-3",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className={cn(
                "text-[11px] text-muted-foreground sm:text-[12px]",
                isHero && "text-[12px] sm:text-[13px]",
                isCompact && "text-[10px]",
              )}
            >
              Journal <span className="text-muted-foreground/50">/</span> Saturday
            </p>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-[10px] text-muted-foreground sm:text-[11px]",
                isHero && "px-3 py-1.5 text-[11px] sm:text-[12px]",
                isCompact && "px-2 py-0.5 text-[10px]",
              )}
            >
              <span>{scenario.sourceLang}</span>
              <span aria-hidden>→</span>
              <span className="font-medium text-foreground">{scenario.targetLang}</span>
            </div>
          </div>

          <p
            className={cn(
              "font-[family-name:var(--font-folio)] font-semibold tracking-[-0.02em] text-foreground",
              isHero ? "text-lg sm:text-xl" : "text-lg",
              isCompact && "text-base",
            )}
          >
            {scenario.title}
          </p>

          <div
            className={cn(
              "relative rounded-md border border-border/60 bg-background",
              isHero
                ? "min-h-[6.5rem] px-4 py-3.5 sm:min-h-[7.25rem] sm:px-5 sm:py-4 lg:min-h-[7.75rem]"
                : "min-h-[5.5rem] px-3 py-3 sm:min-h-[6rem] sm:px-4 sm:py-4",
              isCompact && "min-h-[5rem] px-3 py-2.5",
            )}
          >
            <p
              dir="auto"
              className={cn(
                "whitespace-pre-wrap font-sans leading-[1.65] text-foreground",
                isHero ? "text-[15px] sm:text-base" : "text-[14px] sm:text-[15px]",
                isCompact && "text-[13px]",
              )}
            >
              {phase === "done" ? (
                <>
                  {scenario.prefix}
                  <mark
                    className={journalEditorTranslationHighlightClassName}
                    title={scenario.slashHint}
                  >
                    {scenario.translation}
                  </mark>
                </>
              ) : (
                <>
                  {prefixText}
                  {slashText ? (
                    <mark className={journalEditorTranslationHighlightClassName}>
                      {slashText}
                    </mark>
                  ) : null}
                </>
              )}
              {showCursor ? (
                <span
                  className="ml-px inline-block h-[1.1em] w-px translate-y-px animate-[slash-demo-cursor_1s_ease-in-out_infinite] bg-foreground"
                  aria-hidden
                />
              ) : null}
            </p>

            {showEnter ? (
              <div
                className={cn(
                  "absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-border/80 bg-background/95 px-2 py-1 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm sm:text-[11px]",
                  isHero && "bottom-3 right-3 px-2.5 py-1.5 text-[11px] sm:text-[12px]",
                  isCompact && "bottom-2 right-2 px-2 py-0.5 text-[10px]",
                )}
              >
                <kbd
                  className={cn(
                    "rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[9px] sm:text-[10px]",
                    isHero && "px-2 text-[10px] sm:text-[11px]",
                    isCompact && "px-1.5 text-[9px]",
                  )}
                >
                  {translateTriggerKey}
                </kbd>
                <span className="text-muted-foreground">to translate</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
