"use client";

import type { LucideIcon } from "lucide-react";
import { Languages, MessageSquare, Rows2 } from "lucide-react";
import { useTranslations } from "next-intl";

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

const OPTION_ICONS: Record<CardLanguageView, LucideIcon> = {
  translation: Languages,
  native: MessageSquare,
  both: Rows2,
};

const OPTION_VALUES: CardLanguageView[] = ["translation", "native", "both"];

export function CardLanguageViewSelector({
  value,
  onChange,
  className,
  variant = "default",
}: CardLanguageViewSelectorProps) {
  const t = useTranslations("flashcards.view");
  const isToolbar = variant === "toolbar";

  return (
    <div
      className={cn(
        isToolbar ? flashcardToolbarToggleGroupClassName : pillToggleGroupClassName,
        className,
      )}
      role="group"
      aria-label={t("ariaLabel")}
    >
      {OPTION_VALUES.map((optionValue) => {
        const Icon = OPTION_ICONS[optionValue];
        const label = t(optionValue);
        const active = value === optionValue;
        return (
          <Button
            key={optionValue}
            type="button"
            variant={active ? "default" : "ghost"}
            title={label}
            aria-label={label}
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
            onClick={() => onChange(optionValue)}
          >
            <Icon className={cn(isToolbar ? "size-3" : "size-3.5")} strokeWidth={1.5} />
          </Button>
        );
      })}
    </div>
  );
}
