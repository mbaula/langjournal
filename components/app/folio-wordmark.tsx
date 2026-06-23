import { folioWordmarkClassName } from "@/components/journal/field-styles";
import { cn } from "@/lib/utils";

type FolioWordmarkProps = {
  className?: string;
  showBeta?: boolean;
};

export function FolioWordmark({ className, showBeta = true }: FolioWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={folioWordmarkClassName}>folio</span>
      {showBeta ? (
        <span className="rounded-full bg-black px-1.5 py-0.5 text-xs font-medium lowercase tracking-wide text-white">
          beta
        </span>
      ) : null}
    </span>
  );
}
