import { getTranslations } from "next-intl/server";

import { marketingDemoWindowTitleClassName } from "@/components/marketing/marketing-flow-styles";
import { cn } from "@/lib/utils";

type SlashTranslateDemoShellProps = {
  className?: string;
  children: React.ReactNode;
};

export async function SlashTranslateDemoShell({
  className,
  children,
}: SlashTranslateDemoShellProps) {
  const t = await getTranslations("marketing.demo");

  return (
    <div className={cn("flex w-full max-w-full flex-col sm:w-fit", className)}>
      <div className="w-full max-w-full overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm sm:w-fit">
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <span className="size-2 rounded-full bg-sidebar-primary/40" />
          <span className="size-2 rounded-full bg-sidebar-primary/25" />
          <span className="size-2 rounded-full bg-sidebar-primary/15" />
          <span className={marketingDemoWindowTitleClassName}>
            {t("windowTitle")}
          </span>
        </div>

        <div className="w-full max-w-full p-4 text-left sm:w-fit sm:max-w-[38rem] sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
