import { journalPageTitleClassName } from "@/components/journal/field-styles";
import { LanguageBar } from "@/components/journal/language-bar";
import { cn } from "@/lib/utils";

type JournalHomeHeaderProps = {
  greetingName: string;
  subtitle: string;
  source: string;
  target: string;
};

export function JournalHomeHeader({
  greetingName,
  subtitle,
  source,
  target,
}: JournalHomeHeaderProps) {
  return (
    <header className="w-full">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <h1 className={cn(journalPageTitleClassName, "min-w-0 shrink")}>
          Hi, {greetingName} 👋
        </h1>
        <LanguageBar source={source} target={target} />
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
    </header>
  );
}
