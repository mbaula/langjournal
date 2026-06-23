import { journalPageTitleClassName } from "@/components/journal/field-styles";
import { cn } from "@/lib/utils";

type JournalHomeHeaderProps = {
  greetingName: string;
  subtitle: string;
};

export function JournalHomeHeader({
  greetingName,
  subtitle,
}: JournalHomeHeaderProps) {
  return (
    <header className="w-full">
      <h1 className={cn(journalPageTitleClassName, "min-w-0 shrink")}>
        Hi, {greetingName} 👋
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
    </header>
  );
}
