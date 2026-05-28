import Link from "next/link";

import { FolioWordmark } from "@/components/app/folio-wordmark";
import { cn } from "@/lib/utils";

const exitLinkClass =
  "rounded-md px-1 py-0.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground";

type OnboardingExitHeaderProps = {
  className?: string;
};

export function OnboardingExitHeader({ className }: OnboardingExitHeaderProps) {
  return (
    <header
      className={cn(
        "absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pb-4 pt-[max(1.25rem,env(safe-area-inset-top,0px))] sm:px-10",
        className,
      )}
    >
      <Link
        href="/auth/signout"
        className="rounded-md transition-opacity hover:opacity-90"
        aria-label="Exit setup and return to Folio home"
      >
        <FolioWordmark />
      </Link>

      <nav
        className="flex items-center gap-1 sm:gap-4"
        aria-label="Exit options"
      >
        <Link href="/auth/signout" className={exitLinkClass}>
          Home
        </Link>
        <span className="hidden text-muted-foreground/40 sm:inline" aria-hidden>
          ·
        </span>
        <Link href="/auth/signout" className={exitLinkClass}>
          Sign out
        </Link>
      </nav>
    </header>
  );
}
