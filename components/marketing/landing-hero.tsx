import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,var(--sidebar-primary)/18,transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_50%,var(--contribution-fill)/12,transparent_50%),linear-gradient(to_bottom,var(--app-shell),var(--background))]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[min(88vh,52rem)] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="max-w-4xl">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Daily language journal
          </p>
          <h1 className="max-w-[14ch] font-[family-name:var(--font-folio)] text-[clamp(2.5rem,8vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-foreground">
            Practice any languages for free.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Write in the language you&apos;re learning. When you get stuck, drop in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] font-medium text-foreground">
              {"//"}
            </code>{" "}
            and translate inline — one timeline, no tab switching.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full px-6 text-[15px] shadow-sm",
              )}
            >
              Start for free
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
            <p className="text-[13px] text-muted-foreground">
              No credit card · Magic link sign-in
            </p>
          </div>
        </div>

        <p
          className="pointer-events-none mt-auto select-none pt-16 font-[family-name:var(--font-folio)] text-[clamp(4rem,18vw,11rem)] font-semibold leading-none tracking-[-0.04em] text-foreground/[0.06]"
          aria-hidden
        >
          Folio
        </p>
      </div>
    </section>
  );
}
