"use client";

import type { LucideIcon } from "lucide-react";
import { Languages, MessageSquare, Rows2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CardLanguageView = "native" | "translation" | "both";

type CardLanguageViewSelectorProps = {
  value: CardLanguageView;
  onChange: (value: CardLanguageView) => void;
  className?: string;
};

const OPTIONS: Array<{
  value: CardLanguageView;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "native", label: "Native", icon: MessageSquare },
  { value: "translation", label: "Translation", icon: Languages },
  { value: "both", label: "Both", icon: Rows2 },
];

export function CardLanguageViewSelector({
  value,
  onChange,
  className,
}: CardLanguageViewSelectorProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 rounded-lg border border-border p-0.5",
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
            size="icon-sm"
            variant={active ? "default" : "ghost"}
            title={option.label}
            aria-label={option.label}
            aria-pressed={active}
            className="rounded-md"
            onClick={() => onChange(option.value)}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
          </Button>
        );
      })}
    </div>
  );
}
