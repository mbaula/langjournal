import { journalPageTitleClassName } from "@/components/journal/field-styles";
import { cn } from "@/lib/utils";

type JournalHomeHeaderProps = {
  greeting: string;
  subtitle: string;
};

export function JournalHomeHeader({
  greeting,
  subtitle,
}: JournalHomeHeaderProps) {
  return (
    <header className="w-full">
      <h1 className={cn(journalPageTitleClassName, "min-w-0 shrink")}>
        {greeting}
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
    </header>
  );
}
