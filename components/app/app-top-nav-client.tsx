"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  ChartColumnIncreasing,
  ChevronDown,
  Layers,
  LogOut,
  PenLine,
  Settings,
  User,
} from "lucide-react";

import { CustomizeMenu } from "@/components/app/customize-menu";
import { appNavTabClass, appNavTabGroupClass, appNavTabIconClass, appNavUtilityButtonClass } from "@/components/app/app-nav-styles";
import { FolioWordmark } from "@/components/app/folio-wordmark";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { cn } from "@/lib/utils";

type AppTopNavClientProps = {
  userLabel: string;
  avatarLetter?: string | null;
  previewMode?: boolean;
};

export function AppTopNavClient({
  userLabel,
  avatarLetter = null,
  previewMode = false,
}: AppTopNavClientProps) {
  const t = useTranslations("app.nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (userMenuRef.current?.contains(e.target as Node)) return;
      setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [userMenuOpen]);

  const writeActive =
    pathname === "/app/journal" || pathname.startsWith("/app/journal?");
  const progressActive = pathname.startsWith("/app/progress");
  const flashcardsActive = pathname.startsWith("/app/flashcards");
  const displayUser = userLabel.trim() || tCommon("account");
  const profileInitials = avatarLetter;

  useEffect(() => {
    router.prefetch("/app/journal");
  }, [router]);

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:border-border/40 dark:bg-background/90 dark:supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto grid h-14 max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:h-[3.75rem] sm:gap-4 sm:px-8 md:px-16 lg:px-20">
        <Link
          href="/app/journal"
          className="justify-self-start shrink-0 rounded-md transition-opacity hover:opacity-90"
          aria-label={t("folioHome")}
        >
          <FolioWordmark />
        </Link>

        <nav
          aria-label={t("mainNav")}
          className={appNavTabGroupClass}
        >
          <Link
            href="/app/journal"
            suppressHydrationWarning
            className={appNavTabClass(writeActive)}
          >
            <PenLine
              className={appNavTabIconClass(writeActive)}
              strokeWidth={1.5}
              aria-hidden={!writeActive}
            />
            <span>{t("write")}</span>
          </Link>
          <Link
            href="/app/flashcards"
            prefetch={false}
            suppressHydrationWarning
            className={appNavTabClass(flashcardsActive)}
          >
            <Layers
              className={appNavTabIconClass(flashcardsActive)}
              strokeWidth={1.5}
              aria-hidden={!flashcardsActive}
            />
            <span>{t("practice")}</span>
          </Link>
          <Link
            href="/app/progress"
            prefetch={false}
            suppressHydrationWarning
            className={appNavTabClass(progressActive)}
          >
            <ChartColumnIncreasing
              className={appNavTabIconClass(progressActive)}
              strokeWidth={1.5}
              aria-hidden={!progressActive}
            />
            <span>{t("progress")}</span>
          </Link>
        </nav>

        <div className="flex shrink-0 items-center justify-self-end gap-0.5 sm:gap-1">
          <CustomizeMenu variant="toolbar" />

          <FeedbackButton variant="nav" className="hidden sm:inline-flex" />

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              className={cn(
                appNavUtilityButtonClass,
                "size-9 p-0 sm:size-auto sm:px-2.5",
              )}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label={t("accountMenu")}
            >
              <span className="flex size-7 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/50 text-xs font-medium text-foreground/85">
                {profileInitials ? (
                  <span>{profileInitials}</span>
                ) : (
                  <User className="size-3.5 opacity-70" strokeWidth={1.5} />
                )}
              </span>
              <span className="hidden max-w-[6rem] truncate sm:inline">
                {displayUser}
              </span>
              <ChevronDown
                className={cn(
                  "hidden size-4 shrink-0 opacity-60 transition-transform sm:inline",
                  userMenuOpen && "rotate-180",
                )}
                strokeWidth={1.5}
              />
            </button>
            {userMenuOpen ? (
              <div
                className="absolute top-full right-0 z-50 mt-1 min-w-[12rem] rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg"
                role="menu"
              >
                <Link
                  href="/app/settings"
                  prefetch={false}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="size-4 opacity-70" strokeWidth={1.5} />
                  {t("settings")}
                </Link>
                <Link
                  href={
                    previewMode
                      ? "/api/dev/exit-account-preview"
                      : "/auth/signout"
                  }
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LogOut className="size-4 opacity-70" strokeWidth={1.5} />
                  {previewMode ? t("exitPreview") : t("signOut")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
