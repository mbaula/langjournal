/** Sidebar nav classes; colors from --sidebar-* tokens in globals.css (see accent palettes). */

import { cn } from "@/lib/utils";

export const sidebarNavItemBase =
  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors";

/** Filled accent pill for the active sidebar nav row (e.g. recent entry list item). */
export const sidebarNavRowSelectedClass =
  "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm";

export function sidebarNavItemClass(active: boolean, className?: string) {
  return cn(
    sidebarNavItemBase,
    active
      ? cn(
          sidebarNavRowSelectedClass,
          "font-medium [&_svg]:text-sidebar-primary-foreground [&_svg]:opacity-100",
        )
      : "text-sidebar-foreground hover:bg-sidebar-accent/80 [&_svg]:opacity-70",
    className,
  );
}
