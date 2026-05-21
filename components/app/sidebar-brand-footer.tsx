import Link from "next/link";

import { cn } from "@/lib/utils";

type SidebarBrandFooterProps = {
  className?: string;
};

export function SidebarBrandFooter({ className }: SidebarBrandFooterProps) {
  return (
    <footer
      className={cn(
        "shrink-0 border-t border-sidebar-border px-3 py-3",
        className,
      )}
    >
      <Link
        href="/app/journal"
        className="flex items-center gap-2 rounded-md transition-colors hover:opacity-90"
        aria-label="Folio home"
      >
        <span className="font-[family-name:var(--font-folio)] text-[17px] font-semibold tracking-[-0.02em] text-sidebar-foreground">
          Folio
        </span>
        <span className="ml-auto rounded-full bg-black px-1.5 py-px text-[9px] font-medium uppercase tracking-wide text-white">
          beta
        </span>
      </Link>
    </footer>
  );
}
