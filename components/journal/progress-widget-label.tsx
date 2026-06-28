import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const progressWidgetIconClassName =
  "size-3 shrink-0 text-sidebar-primary opacity-70";

export const progressWidgetLabelClassName =
  "min-w-0 truncate text-xs leading-tight font-medium text-muted-foreground";

type ProgressWidgetLabelProps = {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function ProgressWidgetLabel({
  icon: Icon,
  children,
  className,
}: ProgressWidgetLabelProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <Icon className={progressWidgetIconClassName} strokeWidth={1.5} />
      <span className={progressWidgetLabelClassName}>{children}</span>
    </div>
  );
}
