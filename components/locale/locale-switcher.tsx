"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";

import {
  UI_LOCALES,
  type UiLocale,
  isUiLocale,
  uiLocaleLabel,
} from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

type LocaleSwitcherProps = {
  variant?: "marketing" | "settings";
  className?: string;
  showStatus?: boolean;
};

const localePillTriggerClassName =
  "relative inline-flex h-9 shrink-0 items-center rounded-full border border-border/70 bg-transparent px-3 pr-8 text-[13px] font-medium text-muted-foreground shadow-none transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60 sm:text-sm";

const localePillMenuClassName =
  "z-[100] min-w-[9rem] overflow-hidden rounded-2xl border border-border bg-popover p-1 text-foreground shadow-lg";

const localePillMenuItemClassName =
  "flex w-full items-center rounded-full px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted/50";

export function LocaleSwitcher({
  variant = "marketing",
  className,
  showStatus = variant === "settings",
}: LocaleSwitcherProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("locale");
  const tSettings = useTranslations("settings.displayLanguage");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedLabel = uiLocaleLabel(locale as UiLocale);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
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

  useEffect(() => {
    if (!open || !wrapRef.current) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = wrapRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const minWidth = Math.max(rect.width, 144);
      const left =
        variant === "marketing"
          ? rect.right - minWidth
          : rect.left;

      setMenuPosition({
        top: rect.bottom + 6,
        left,
        minWidth,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, variant]);

  async function selectLocale(nextLocale: string) {
    if (!isUiLocale(nextLocale) || nextLocale === locale) {
      close();
      return;
    }

    setError(null);
    setSaved(false);
    close();

    startTransition(async () => {
      try {
        const res = await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uiLocale: nextLocale }),
        });
        const data = (await res.json()) as { error?: string };

        if (!res.ok) {
          setError(data.error ?? tSettings("error"));
          return;
        }

        setSaved(true);
        router.refresh();
      } catch {
        setError(tSettings("error"));
      }
    });
  }

  const menu =
    open && menuPosition ? (
      <div
        ref={menuRef}
        role="listbox"
        aria-label={t("switcherLabel")}
        className={cn(localePillMenuClassName, "fixed")}
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          minWidth: menuPosition.minWidth,
        }}
      >
        {UI_LOCALES.map(({ code, label }) => {
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={active}
              className={cn(
                localePillMenuItemClassName,
                active && "bg-muted/60 font-medium",
              )}
              onClick={() => void selectLocale(code)}
            >
              {label}
            </button>
          );
        })}
      </div>
    ) : null;

  const trigger = (
    <div
      ref={wrapRef}
      className={cn("relative shrink-0", className)}
    >
      <button
        id={variant === "settings" ? "display-language" : undefined}
        type="button"
        aria-label={t("switcherLabel")}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={isPending}
        className={cn(
          localePillTriggerClassName,
          open && "bg-muted/20 text-foreground",
          variant === "marketing" && "w-full justify-center sm:w-auto",
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

      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );

  if (variant === "marketing") {
    return trigger;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {trigger}
      {showStatus ? (
        <p
          className={cn(
            "text-sm",
            error ? "text-destructive" : "text-muted-foreground",
          )}
          role={error ? "alert" : undefined}
        >
          {error ?? (isPending ? tSettings("saving") : saved ? tSettings("saved") : null)}
        </p>
      ) : null}
    </div>
  );
}

export function isSupportedUiLocale(value: string): value is UiLocale {
  return isUiLocale(value);
}
