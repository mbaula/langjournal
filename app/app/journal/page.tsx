import { Editor } from "@/components/journal/editor";
import { LanguageBar } from "@/components/journal/language-bar";

export default function JournalPage() {
  return (
    <div className="flex flex-col items-center gap-6 pt-8">
      <h1 className="text-xl font-medium text-muted-foreground">Journal</h1>
      <LanguageBar source="en" target="fr" />
      <div className="w-full max-w-xl px-4">
        <Editor />
      </div>
    </div>
  );
}
