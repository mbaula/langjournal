import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ForceLightScopeProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
};

/** Locks a subtree to light semantic tokens even when `html` is in dark mode. */
export function ForceLightScope({
  children,
  className,
  ...props
}: ForceLightScopeProps) {
  return (
    <div
      data-force-light-scope
      {...props}
      className={cn(
        "min-h-dvh bg-background text-foreground transition-colors",
        className,
      )}
    >
      {children}
    </div>
  );
}
