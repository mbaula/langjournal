"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export function columnCountForContainerWidth(width: number): number {
  if (width >= 1120) return 4;
  if (width >= 704) return 3;
  if (width >= 448) return 2;
  return 1;
}

export function distributeRoundRobin<T>(
  items: readonly T[],
  columnCount: number,
): T[][] {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  items.forEach((item, index) => {
    columns[index % columnCount]!.push(item);
  });
  return columns;
}

type FlashcardLibraryGridProps<T> = {
  items: readonly T[];
  getItemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  className?: string;
};

type FlashcardLibraryGridSkeletonProps = {
  itemCount: number;
  className?: string;
};

/** Static SSR placeholder — avoids hydrating client-only card markup. */
export function FlashcardLibraryGridSkeleton({
  itemCount,
  className,
}: FlashcardLibraryGridSkeletonProps) {
  const placeholders = Math.min(Math.max(itemCount, 1), 6);

  return (
    <div
      className={cn("flex w-full gap-4", className)}
      aria-hidden="true"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {Array.from({ length: placeholders }, (_, index) => (
          <div
            key={index}
            className="min-h-[5.75rem] rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}

export function FlashcardLibraryGrid<T>({
  items,
  getItemKey,
  renderItem,
  className,
}: FlashcardLibraryGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const syncColumnCount = () => {
      setColumnCount(columnCountForContainerWidth(container.clientWidth));
    };

    syncColumnCount();
    const observer = new ResizeObserver(syncColumnCount);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const columns = useMemo(
    () => distributeRoundRobin(items, columnCount),
    [columnCount, items],
  );

  return (
    <div ref={containerRef} className={cn("flex w-full gap-4", className)}>
      {columns.map((columnItems, columnIndex) => (
        <div
          key={columnIndex}
          className="flex min-w-0 flex-1 flex-col gap-4"
        >
          {columnItems.map((item) => (
            <div key={getItemKey(item)}>{renderItem(item)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
