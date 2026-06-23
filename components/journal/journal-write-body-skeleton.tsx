import { appPageShellClassName } from "@/components/journal/field-styles";

export function JournalWriteBodySkeleton() {
  return (
    <div className={appPageShellClassName} aria-hidden>
      <div className="space-y-2">
        <div className="h-8 w-56 max-w-full animate-pulse rounded-md bg-muted/70" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted/50" />
      </div>
      <div className="h-28 w-full max-w-sm animate-pulse rounded-xl bg-muted/60" />
      <div className="flex flex-col gap-3">
        <div className="h-7 w-2/3 max-w-md animate-pulse rounded-md bg-muted/70" />
        <div className="min-h-[calc(100dvh-16rem)] animate-pulse rounded-md bg-muted/40" />
      </div>
    </div>
  );
}
