import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-border border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/app/journal" className="text-sm font-semibold">
            Language Journal
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/app/journal"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Journal
            </Link>
            <Link
              href="/app/settings"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
