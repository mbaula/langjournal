"use client";

import { RouteErrorFallback } from "@/components/app/route-error-fallback";

export default function RootRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <RouteErrorFallback error={error} reset={reset} />
    </div>
  );
}
