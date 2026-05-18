"use client";

/** Accent picker UI; palette tokens live in globals.css (see lib/theme/accent.ts). */

import { useEffect, useRef, useState } from "react";
import { Moon, Palette, Sun } from "lucide-react";

import { useAccent } from "@/components/accent-provider";
import { useTheme } from "@/components/theme-provider";
import { ACCENT_OPTIONS, type AccentId } from "@/lib/theme/accent";
import { cn } from "@/lib/utils";

export function CustomizeMenu() {
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
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
          "hover:bg-sidebar-accent",
          open && "bg-sidebar-accent",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Palette className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
        Customize
      </button>

      {open ? (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
          role="menu"
        >
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Color
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Accent color">
            {ACCENT_OPTIONS.map((option) => {
              const selected = accent === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  title={option.label}
                  onClick={() => selectAccent(option.id)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border transition-[transform,box-shadow,border-color] duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    selected
                      ? "scale-105 border-foreground/30 shadow-sm"
                      : "border-border/80 hover:scale-105 hover:border-border",
                  )}
                >
                  <span
                    className="size-5 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                    style={{ background: option.swatch }}
                  />
                  <span className="sr-only">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="my-3 border-t border-border/60" />

          <button
            type="button"
            role="menuitem"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-muted"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <>
                  <Sun className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
                  Light mode
                </>
              ) : (
                <>
                  <Moon className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
                  Dark mode
                </>
              )
            ) : (
              <>
                <Moon className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
                Theme
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
