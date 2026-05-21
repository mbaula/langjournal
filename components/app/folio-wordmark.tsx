import { cn } from "@/lib/utils";

type FolioWordmarkProps = {
  className?: string;
  showBeta?: boolean;
};

export function FolioWordmark({ className, showBeta = true }: FolioWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="font-[family-name:var(--font-folio)] text-[17px] font-semibold tracking-[-0.02em] text-foreground">
        Folio
      </span>
      {showBeta ? (
        <span className="rounded-full bg-black px-1.5 py-px text-[9px] font-medium uppercase tracking-wide text-white">
          beta
        </span>
      ) : null}
    </span>
  );
}
