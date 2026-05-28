import Link from "next/link";

import { FolioWordmark } from "@/components/app/folio-wordmark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinkClass =
  "rounded-md px-2 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground";

export function MarketingNav() {
  return (
    <header className="landing-enter sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-md transition-opacity hover:opacity-90"
          aria-label="Folio home"
        >
          <FolioWordmark />
        </Link>

        <nav
          className="flex items-center gap-0.5 sm:gap-1"
          aria-label="Marketing navigation"
        >
          <Link href="#solution" className={cn(navLinkClass, "hidden sm:inline-flex")}>
            Features
          </Link>
          <Link href="#pricing" className={cn(navLinkClass, "hidden sm:inline-flex")}>
            Pricing
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-9 rounded-full px-4 text-[13px] sm:ml-1",
            )}
          >
            Get started free
          </Link>
        </nav>
      </div>
    </header>
  );
}
