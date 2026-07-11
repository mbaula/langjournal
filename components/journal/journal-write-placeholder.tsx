"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { journalEditorTranslationHighlightClassName } from "@/components/journal/field-styles";
import { cn } from "@/lib/utils";

const TYPING_INTERVAL_MS = 42;
const HOLD_TYPED_MS = 900;
const HOLD_TRANSLATED_MS = 2400;
const PAUSE_AT_START_MS = 600;

/** Example target-language renderings of the “translate in-line” slash segment. */
const TRANSLATED_EXAMPLES = [
  "traducir en línea",
  "traduire en ligne",
  "dịch ngay trong câu",
  "行内翻译",
  "インラインで翻訳",
  "इनलाइन अनुवाद करें",
] as const;

type DemoPhase = "typing" | "holdTyped" | "translated";

type JournalWritePlaceholderProps = {
  className?: string;
};

export function JournalWritePlaceholder({ className }: JournalWritePlaceholderProps) {
  const t = useTranslations("journal");
  const placeholderText = t("writePlaceholder");
  const highlightStart = useMemo(
    () => placeholderText.indexOf("//"),
    [placeholderText],
  );

  const [phase, setPhase] = useState<DemoPhase>("typing");
  const [visibleLength, setVisibleLength] = useState(0);
  const [translationIndex, setTranslationIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    setPhase("typing");
    setVisibleLength(0);
  }, [placeholderText, prefersReducedMotion, cycleKey]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase("translated");
      setVisibleLength(placeholderText.length);
      return;
    }

    if (phase === "typing") {
      if (visibleLength >= placeholderText.length) {
        if (placeholderText.length === 0) return;
        setPhase("holdTyped");
        return;
      }

      const delay = visibleLength === 0 ? PAUSE_AT_START_MS : TYPING_INTERVAL_MS;
      const timeoutId = window.setTimeout(() => {
        setVisibleLength((length) =>
          Math.min(length + 1, placeholderText.length),
        );
      }, delay);
      return () => window.clearTimeout(timeoutId);
    }

    if (phase === "holdTyped") {
      const timeoutId = window.setTimeout(() => {
        setPhase("translated");
      }, HOLD_TYPED_MS);
      return () => window.clearTimeout(timeoutId);
    }

    if (phase === "translated") {
      const timeoutId = window.setTimeout(() => {
        setTranslationIndex((index) => (index + 1) % TRANSLATED_EXAMPLES.length);
        setCycleKey((key) => key + 1);
      }, HOLD_TRANSLATED_MS);
      return () => window.clearTimeout(timeoutId);
    }
  }, [phase, visibleLength, placeholderText, prefersReducedMotion]);

  const translation = TRANSLATED_EXAMPLES[translationIndex]!;
  const showTranslated =
    (phase === "translated" || prefersReducedMotion) && highlightStart >= 0;

  const visibleText = placeholderText.slice(
    0,
    showTranslated ? highlightStart : visibleLength,
  );
  const plainPrefix =
    highlightStart >= 0
      ? visibleText.slice(0, Math.min(visibleText.length, highlightStart))
      : visibleText;
  const highlightedSlash =
    !showTranslated && highlightStart >= 0 && visibleLength > highlightStart
      ? placeholderText.slice(highlightStart, visibleLength)
      : "";

  return (
    <p
      className={cn(
        "font-sans whitespace-pre-wrap text-base leading-[1.65] text-muted-foreground/70 antialiased dark:text-foreground/78",
        className,
      )}
      aria-hidden
    >
      {plainPrefix}
      {showTranslated ? (
        <mark className={journalEditorTranslationHighlightClassName}>
          {translation}
        </mark>
      ) : highlightedSlash ? (
        <mark className={journalEditorTranslationHighlightClassName}>
          {highlightedSlash}
        </mark>
      ) : null}
      {!prefersReducedMotion && phase === "typing" ? (
        <span className="ml-px inline-block h-[1.1em] w-px translate-y-px animate-[slash-demo-cursor_1s_ease-in-out_infinite] bg-muted-foreground/50 dark:bg-foreground/55" />
      ) : null}
    </p>
  );
}
