"use client";

import type { LucideIcon } from "lucide-react";
import { Languages, MessageSquare, Rows2 } from "lucide-react";

import {
  flashcardToolbarIconButtonActiveClassName,
  flashcardToolbarIconButtonClassName,
  flashcardToolbarToggleGroupClassName,
} from "@/components/flashcards/flashcard-toolbar-styles";
import {
  pillToggleGroupClassName,
  primaryPillIconButtonClassName,
  secondaryPillButtonClassName,
} from "@/components/journal/field-styles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CardLanguageView = "native" | "translation" | "both";

type CardLanguageViewSelectorProps = {
  value: CardLanguageView;
  onChange: (value: CardLanguageView) => void;
  className?: string;
  variant?: "default" | "toolbar";
};

const OPTIONS: Array<{
  value: CardLanguageView;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "translation", label: "Translation", icon: Languages },
  { value: "native", label: "Native", icon: MessageSquare },
  { value: "both", label: "Both", icon: Rows2 },
];

export function CardLanguageViewSelector({
  value,
  onChange,
  className,
  variant = "default",
}: CardLanguageViewSelectorProps) {
  const isToolbar = variant === "toolbar";

  return (
    <div
      className={cn(
        isToolbar ? flashcardToolbarToggleGroupClassName : pillToggleGroupClassName,
        className,
      )}
      role="group"
      aria-label="Card language view"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "ghost"}
            title={option.label}
            aria-label={option.label}
            aria-pressed={active}
            className={cn(
              isToolbar
                ? active
                  ? flashcardToolbarIconButtonActiveClassName
                  : flashcardToolbarIconButtonClassName
                : active
                  ? cn(primaryPillIconButtonClassName, "border-0 shadow-none")
                  : secondaryPillButtonClassName,
            )}
            onClick={() => onChange(option.value)}
          >
            <Icon className={cn(isToolbar ? "size-3" : "size-3.5")} strokeWidth={1.5} />
          </Button>
        );
      })}
    </div>
  );
}
