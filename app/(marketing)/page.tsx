import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MarketingHomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Language Journal
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Write in your own words, translate on command, and keep original and
          translated text in one timeline.
        </p>
      </div>
      <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
        Sign in to journal
      </Link>
    </div>
  );
}
