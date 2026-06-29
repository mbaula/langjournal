import {
  journalWritePageShellClassName,
  journalWriteViewportClassName,
  journalWriteWorkspaceClassName,
} from "@/components/journal/field-styles";
import { cn } from "@/lib/utils";

export function JournalWriteBodySkeleton() {
  return (
    <div className={journalWritePageShellClassName} aria-hidden>
      <div className="space-y-2">
        <div className="h-8 w-56 max-w-full animate-pulse rounded-md bg-muted/70" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted/50" />
      </div>
      <div
        className={cn(
          journalWriteWorkspaceClassName,
          journalWriteViewportClassName,
        )}
      >
        <div className="h-full min-h-48 w-full animate-pulse rounded-xl bg-muted/60" />
        <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-journal-surface p-4 sm:p-5">
          <div className="h-10 w-48 max-w-full shrink-0 animate-pulse rounded-full bg-muted/60" />
          <div className="h-7 w-2/3 max-w-md shrink-0 animate-pulse rounded-md bg-muted/70" />
          <div className="min-h-0 flex-1 animate-pulse rounded-md bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
