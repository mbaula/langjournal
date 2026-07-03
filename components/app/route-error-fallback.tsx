"use client";

import { Button } from "@/components/ui/button";

type RouteErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteErrorFallback({ error, reset }: RouteErrorFallbackProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-lg font-semibold text-foreground">
        This page couldn&apos;t load
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Something went wrong on our end. Try again, or reload the page.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground/70">
          {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      </div>
    </div>
  );
}
