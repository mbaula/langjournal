"use client";

import { Settings } from "lucide-react";

type LanguageBarProps = {
  source: string;
  target: string;
};

export function LanguageBar({ source, target }: LanguageBarProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-border/80 bg-background/90 font-sans text-sm shadow-sm backdrop-blur-sm">
      <span className="px-4 py-2 font-medium text-foreground">
        {source.toUpperCase()} &rarr; {target.toUpperCase()}
      </span>
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/85"
        aria-label="Language settings"
      >
        <Settings className="size-4" />
      </button>
    </div>
  );
}
