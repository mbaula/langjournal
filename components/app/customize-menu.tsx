"use client";

/** Accent picker UI; palette tokens live in globals.css (see lib/theme/accent.ts). */

import { useEffect, useRef, useState } from "react";
import { Moon, Palette, Sun } from "lucide-react";

import { useAccent } from "@/components/accent-provider";
import { useTheme } from "@/components/theme-provider";
import {
  ACCENT_OPTIONS,
  accentLabel,
  type AccentId,
} from "@/lib/theme/accent";
import { cn } from "@/lib/utils";

export function CustomizeMenu({ variant = "sidebar" }: { variant?: "sidebar" | "toolbar" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const selectAccent = (id: AccentId) => {
    setAccent(id);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          variant === "toolbar"
            ? "inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            : cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                "hover:bg-sidebar-accent",
                open && "bg-sidebar-accent",
              ),
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Customize appearance"
      >
        <Palette className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
        {variant === "sidebar" ? "Customize" : null}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-full z-50 mt-1 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg",
            variant === "toolbar"
              ? "right-0 w-56"
              : "right-0 left-0",
          )}
          role="menu"
        >
          <div
            className="flex items-center gap-2 px-2 py-1.5 text-sm"
            id="customize-accent-label"
          >
            <Palette className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
            Color
          </div>
          <div
            className="grid grid-cols-5 gap-2 px-2 pb-1"
            role="group"
            aria-labelledby="customize-accent-label"
          >
            {ACCENT_OPTIONS.map((option) => {
              const selected = accent === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  title={accentLabel(option.id)}
                  aria-label={accentLabel(option.id)}
                  onClick={() => selectAccent(option.id)}
                  className={cn(
                    "flex size-8 items-center justify-center justify-self-center rounded-md border transition-[transform,box-shadow,border-color] duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    selected
                      ? "scale-105 border-foreground/30 shadow-sm"
                      : "border-border hover:scale-105 hover:border-border",
                  )}
                >
                  <span
                    className="size-5 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                    style={{ backgroundColor: option.swatch }}
                    aria-hidden
                  />
                  <span className="sr-only">{accentLabel(option.id)}</span>
                </button>
              );
            })}
          </div>

          <div className="my-3 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <>
                  <Sun className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
                  Light mode
                </>
              ) : (
                <>
                  <Moon className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
                  Dark mode
                </>
              )
            ) : (
              <>
                <Moon className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
                Theme
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
