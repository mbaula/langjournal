"use client";

import { useEffect, useState } from "react";

import { journalEditorTranslationHighlightClassName } from "@/components/journal/field-styles";
import { cn } from "@/lib/utils";

const PLACEHOLDER_TEXT =
  "When you're stuck, type // to translate in-line";

const HIGHLIGHT_START = PLACEHOLDER_TEXT.indexOf("//");

const TYPING_INTERVAL_MS = 42;
const PAUSE_AT_END_MS = 2400;
const PAUSE_AT_START_MS = 600;

type JournalWritePlaceholderProps = {
  className?: string;
};

export function JournalWritePlaceholder({ className }: JournalWritePlaceholderProps) {
  const [visibleLength, setVisibleLength] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleLength(PLACEHOLDER_TEXT.length);
      return;
    }

    let timeoutId = 0;
    let cancelled = false;

    const tick = (nextLength: number) => {
      if (cancelled) return;

      if (nextLength >= PLACEHOLDER_TEXT.length) {
        timeoutId = window.setTimeout(() => {
          setVisibleLength(0);
          timeoutId = window.setTimeout(() => tick(1), PAUSE_AT_START_MS);
        }, PAUSE_AT_END_MS);
        return;
      }

      setVisibleLength(nextLength);
      timeoutId = window.setTimeout(() => tick(nextLength + 1), TYPING_INTERVAL_MS);
    };

    timeoutId = window.setTimeout(() => tick(1), PAUSE_AT_START_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [prefersReducedMotion]);

  const visibleText = PLACEHOLDER_TEXT.slice(0, visibleLength);
  const plainPrefix =
    HIGHLIGHT_START >= 0
      ? visibleText.slice(0, Math.min(visibleLength, HIGHLIGHT_START))
      : visibleText;
  const highlightedPart =
    HIGHLIGHT_START >= 0 && visibleLength > HIGHLIGHT_START
      ? visibleText.slice(HIGHLIGHT_START)
      : "";

  return (
    <p
      className={cn(
        "font-sans whitespace-pre-wrap text-base leading-[1.65] text-muted-foreground/70 antialiased",
        className,
      )}
      aria-hidden
    >
      {plainPrefix}
      {highlightedPart ? (
        <mark className={journalEditorTranslationHighlightClassName}>
          {highlightedPart}
        </mark>
      ) : null}
      {!prefersReducedMotion && visibleLength < PLACEHOLDER_TEXT.length ? (
        <span className="ml-px inline-block h-[1.1em] w-px translate-y-px animate-[slash-demo-cursor_1s_ease-in-out_infinite] bg-muted-foreground/50" />
      ) : null}
    </p>
  );
}
