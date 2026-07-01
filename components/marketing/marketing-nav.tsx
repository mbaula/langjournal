"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { FolioWordmark } from "@/components/app/folio-wordmark";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { LocaleSwitcher } from "@/components/locale/locale-switcher";
import {
  marketingNavCtaClassName,
  marketingNavLinkClassName,
} from "@/components/marketing/marketing-flow-styles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const t = useTranslations("marketing.nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/#solution", label: t("features") },
    { href: "/#faq", label: t("faq") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center lg:px-8">
        <Link
          href="/"
          className="shrink-0 justify-self-start rounded-md transition-opacity hover:opacity-90"
          aria-label={t("folioHome")}
          onClick={() => setMobileOpen(false)}
        >
          <FolioWordmark />
        </Link>

        <nav
          className="hidden items-center justify-center gap-0.5 md:flex md:gap-1"
          aria-label="Marketing navigation"
        >
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={marketingNavLinkClassName}>
              {label}
            </Link>
          ))}
          <FeedbackButton
            variant="marketing"
            className={marketingNavLinkClassName}
          />
        </nav>

        <div className="flex shrink-0 items-center justify-self-end gap-2 sm:gap-3">
          <LocaleSwitcher variant="marketing" className="hidden sm:block" />
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "sm" }),
              marketingNavCtaClassName,
              "hidden sm:inline-flex",
            )}
          >
            {t("tryFree")}
          </Link>

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted/60 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="marketing-mobile-nav"
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="size-5" strokeWidth={1.5} />
            ) : (
              <Menu className="size-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      <div
        id="marketing-mobile-nav"
        className={cn(
          "border-t border-border/60 bg-background/95 md:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <nav
          className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6 lg:px-8"
          aria-label="Mobile marketing navigation"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                marketingNavLinkClassName,
                "w-full px-2 py-3 text-left",
              )}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <FeedbackButton
            variant="marketing"
            className={cn(
              marketingNavLinkClassName,
              "w-full justify-start px-2 py-3 text-left",
            )}
          />
          <div className="px-2 py-3">
            <LocaleSwitcher variant="marketing" className="w-full" />
          </div>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "sm" }),
              marketingNavCtaClassName,
              "mt-2 w-full sm:hidden",
            )}
            onClick={() => setMobileOpen(false)}
          >
            {t("tryFree")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
