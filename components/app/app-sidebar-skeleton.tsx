export function AppSidebarSkeleton() {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-sidebar-border border-r bg-sidebar text-sidebar-foreground">
      <div className="border-sidebar-border border-b px-2 py-2">
        <div className="flex w-full items-center gap-2 rounded-md px-2 py-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 py-2">
        <div className="shrink-0 space-y-1">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <div className="size-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <div className="size-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <div className="size-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="h-3 w-16 animate-pulse rounded bg-muted px-2" />
          <div className="mt-3 space-y-2">
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </aside>
  );
}
