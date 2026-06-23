import { DailyPromptSection } from "@/components/journal/daily-prompt-section";
import { type TranslateTrigger } from "@/components/journal/journal-editor";
import { JournalWriteBody } from "@/components/journal/journal-write-body";
import { isAccountPreviewMode, requireAppSession } from "@/lib/auth/session";
import {
  DEV_PREVIEW_ENTRY_ID,
  getDevPreviewJournalEntries,
  getDevPreviewLanguagePair,
  getDevPreviewOnboardingState,
} from "@/lib/dev/preview-account";
import { getOnboardingState } from "@/lib/db/onboarding";
import { getLanguagePair } from "@/lib/db/language";
import {
  journalGreetingName,
  pickEncouragingSubtitle,
} from "@/lib/journal/greeting";
import {
  getOrCreateJournalEntryForDate,
  isPastJournalEntry,
  listJournalEntries,
} from "@/lib/entries/service";

const translateTrigger: TranslateTrigger =
  (process.env.NEXT_PUBLIC_TRANSLATE_TRIGGER as TranslateTrigger) || "enter";

function normalizeTranslations(translations: unknown) {
  return Array.isArray(translations) ? translations : [];
}

export default async function JournalPage() {
  const preview = await isAccountPreviewMode();

  if (preview) {
    const { source, target } = getDevPreviewLanguagePair();
    const onboarding = getDevPreviewOnboardingState();
    const todayEntry =
      getDevPreviewJournalEntries().find(
        (entry) => entry.id === DEV_PREVIEW_ENTRY_ID,
      ) ?? getDevPreviewJournalEntries()[0]!;
    const pastEntries = getDevPreviewJournalEntries().filter((entry) =>
      isPastJournalEntry(entry.entryDate),
    );
    const greetingName = journalGreetingName(
      onboarding.displayName,
      "alex.preview@folio.local",
    );
    const encouragingSubtitle = pickEncouragingSubtitle();

    return (
      <JournalWriteBody
        greetingName={greetingName}
        subtitle={encouragingSubtitle}
        sourceLanguage={source}
        targetLanguage={target}
        translateTrigger={translateTrigger}
        entryId={todayEntry.id}
        initialBody={todayEntry.body ?? ""}
        initialTranslations={normalizeTranslations(todayEntry.translations)}
        pastEntries={pastEntries}
      />
    );
  }

  const user = await requireAppSession();
  const [{ entry: todayEntry }, entries, { source, target }, onboarding] =
    await Promise.all([
      getOrCreateJournalEntryForDate(user.id, new Date()),
      listJournalEntries(user.id),
      getLanguagePair(user.id),
      getOnboardingState(user.id),
    ]);

  const pastEntries = entries.filter((entry) =>
    isPastJournalEntry(entry.entryDate),
  );

  const greetingName = journalGreetingName(onboarding.displayName, user.email);
  const encouragingSubtitle = pickEncouragingSubtitle();

  return (
    <JournalWriteBody
      greetingName={greetingName}
      subtitle={encouragingSubtitle}
      sourceLanguage={source}
      targetLanguage={target}
      translateTrigger={translateTrigger}
      entryId={todayEntry.id}
      initialBody={todayEntry.body ?? ""}
      initialTranslations={normalizeTranslations(todayEntry.translations)}
      pastEntries={pastEntries}
      prompt={
        <DailyPromptSection
          entryId={todayEntry.id}
          userId={user.id}
          isToday
        />
      }
    />
  );
}
