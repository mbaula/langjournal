"use client";

/** Accent picker UI; palette tokens live in globals.css (see lib/theme/accent.ts). */

import { useEffect, useRef, useState } from "react";
import { Moon, Palette, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAccent } from "@/components/accent-provider";
import { useTheme } from "@/components/theme-provider";
import {
  ACCENT_OPTIONS,
  accentLabel,
  type AccentId,
} from "@/lib/theme/accent";
import { cn } from "@/lib/utils";

const customizePopoverClassName =
  "absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-lg";

const accentSwatchClassName =
  "size-7 rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-[transform,box-shadow,ring-color] duration-150 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]";

export function CustomizeMenu({ variant = "sidebar" }: { variant?: "sidebar" | "toolbar" }) {
  const t = useTranslations("customize");
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
        aria-label={t("ariaLabel")}
      >
        <Palette className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
        {variant === "sidebar" ? t("label") : null}
      </button>

      {open ? (
        <div
          className={cn(
            customizePopoverClassName,
            variant === "toolbar" ? "right-0 w-[12.75rem] p-4" : "right-0 left-0 p-4",
          )}
          role="menu"
        >
          <div className="mb-3">
            <p
              className="text-sm font-semibold text-foreground"
              id="customize-accent-label"
            >
              {t("color")}
            </p>
          </div>
          <div
            className="grid grid-cols-5 gap-1.5"
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
                  style={{ backgroundColor: option.swatch }}
                  className={cn(
                    accentSwatchClassName,
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "ring-2 ring-foreground/35 ring-offset-2 ring-offset-background"
                      : "hover:scale-[1.03]",
                  )}
                />
              );
            })}
          </div>

          <div className="my-4 h-px bg-border" role="presentation" />

          <button
            type="button"
            role="menuitem"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <>
                  <Sun className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
                  {t("lightMode")}
                </>
              ) : (
                <>
                  <Moon className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
                  {t("darkMode")}
                </>
              )
            ) : (
              <>
                <Moon className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
                {t("theme")}
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
