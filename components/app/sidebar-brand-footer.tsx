import Link from "next/link";

import { FolioWordmark } from "@/components/app/folio-wordmark";
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
        <FolioWordmark />
      </Link>
    </footer>
  );
}
