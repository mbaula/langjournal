import Link from "next/link";

import { FolioWordmark } from "@/components/app/folio-wordmark";
import { cn } from "@/lib/utils";

const exitLinkClass =
  "rounded-md px-1 py-0.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground";

type OnboardingExitHeaderProps = {
  className?: string;
  previewMode?: boolean;
};

export function OnboardingExitHeader({
  className,
  previewMode = false,
}: OnboardingExitHeaderProps) {
  const homeHref = previewMode ? "/app/journal" : "/auth/signout";
  const homeLabel = previewMode ? "Back to journal" : "Home";

  return (
    <header
      className={cn(
        "absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pb-4 pt-[max(1.25rem,env(safe-area-inset-top,0px))] sm:px-10",
        className,
      )}
    >
      <Link
        href={homeHref}
        className="rounded-md transition-opacity hover:opacity-90"
        aria-label={
          previewMode ? "Back to journal" : "Exit setup and return to Folio home"
        }
      >
        <FolioWordmark />
      </Link>

      <nav
        className="flex items-center gap-1 sm:gap-4"
        aria-label="Exit options"
      >
        <Link href={homeHref} className={exitLinkClass}>
          {homeLabel}
        </Link>
        {previewMode ? null : (
          <>
            <span className="hidden text-muted-foreground/40 sm:inline" aria-hidden>
              ·
            </span>
            <Link href="/auth/signout" className={exitLinkClass}>
              Sign out
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
