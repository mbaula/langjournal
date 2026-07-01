"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { journalEditorTranslationHighlightClassName } from "@/components/journal/field-styles";
import { cn } from "@/lib/utils";

const TYPING_INTERVAL_MS = 42;
const PAUSE_AT_END_MS = 2400;
const PAUSE_AT_START_MS = 600;

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
      setVisibleLength(placeholderText.length);
      return;
    }

    let timeoutId = 0;
    let cancelled = false;

    const tick = (nextLength: number) => {
      if (cancelled) return;

      if (nextLength > placeholderText.length) {
        timeoutId = window.setTimeout(() => {
          setVisibleLength(0);
          timeoutId = window.setTimeout(() => tick(1), PAUSE_AT_START_MS);
        }, PAUSE_AT_END_MS);
        return;
      }

      setVisibleLength(nextLength);

      if (nextLength === placeholderText.length) {
        timeoutId = window.setTimeout(() => tick(nextLength + 1), PAUSE_AT_END_MS);
        return;
      }

      timeoutId = window.setTimeout(() => tick(nextLength + 1), TYPING_INTERVAL_MS);
    };

    timeoutId = window.setTimeout(() => tick(1), PAUSE_AT_START_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [placeholderText, prefersReducedMotion]);

  const visibleText = placeholderText.slice(0, visibleLength);
  const plainPrefix =
    highlightStart >= 0
      ? visibleText.slice(0, Math.min(visibleLength, highlightStart))
      : visibleText;
  const highlightedPart =
    highlightStart >= 0 && visibleLength > highlightStart
      ? visibleText.slice(highlightStart)
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
      {highlightedPart ? (
        <mark className={journalEditorTranslationHighlightClassName}>
          {highlightedPart}
        </mark>
      ) : null}
      {!prefersReducedMotion && visibleLength < placeholderText.length ? (
        <span className="ml-px inline-block h-[1.1em] w-px translate-y-px animate-[slash-demo-cursor_1s_ease-in-out_infinite] bg-muted-foreground/50 dark:bg-foreground/55" />
      ) : null}
    </p>
  );
}
