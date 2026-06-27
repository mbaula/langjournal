"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  flashcardToolbarPillMenuClassName,
  flashcardToolbarPillMenuItemClassName,
  flashcardToolbarPillTriggerClassName,
} from "@/components/flashcards/flashcard-toolbar-styles";
import { cn } from "@/lib/utils";

type FlashcardToolbarSelectOption<T extends string> = {
  value: T;
  label: string;
};

type FlashcardToolbarSelectProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly FlashcardToolbarSelectOption<T>[];
  ariaLabel: string;
  className?: string;
};

export function FlashcardToolbarSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: FlashcardToolbarSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onDocumentMouseDown = (event: MouseEvent) => {
      if (wrapRef.current?.contains(event.target as Node)) return;
      close();
    };

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [close, open]);

  return (
    <div ref={wrapRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          flashcardToolbarPillTriggerClassName,
          open && "bg-muted/50",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          strokeWidth={1.5}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={flashcardToolbarPillMenuClassName}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  flashcardToolbarPillMenuItemClassName,
                  active && "bg-muted/60 font-medium",
                )}
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
