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
  encouragingSubtitleIndex,
  journalGreetingName,
} from "@/lib/journal/greeting";
import { getDailyPromptForEntry } from "@/lib/prompts/daily-prompt";
import {
  getOrCreateJournalEntryForDate,
  isSavedJournalEntry,
  listJournalEntries,
} from "@/lib/entries/service";
import { getTranslations } from "next-intl/server";

const translateTrigger: TranslateTrigger =
  (process.env.NEXT_PUBLIC_TRANSLATE_TRIGGER as TranslateTrigger) || "enter";

function normalizeTranslations(translations: unknown) {
  return Array.isArray(translations) ? translations : [];
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit: initialEditEntryId } = await searchParams;
  const t = await getTranslations("journal");
  const preview = await isAccountPreviewMode();

  if (preview) {
    const { source, target } = getDevPreviewLanguagePair();
    const onboarding = getDevPreviewOnboardingState();
    const todayEntry =
      getDevPreviewJournalEntries().find(
        (entry) => entry.id === DEV_PREVIEW_ENTRY_ID,
      ) ?? getDevPreviewJournalEntries()[0]!;
    const pastEntries = getDevPreviewJournalEntries().filter((entry) =>
      entry.id !== todayEntry.id,
    );
    const name = journalGreetingName(
      onboarding.displayName,
      "alex.preview@folio.local",
    );
    const greeting = t("greeting", {
      name: name === "there" ? t("greetingFallback") : name,
    });
    const subtitle = t(`subtitles.${encouragingSubtitleIndex()}`);

    return (
      <JournalWriteBody
        greeting={greeting}
        subtitle={subtitle}
        sourceLanguage={source}
        targetLanguage={target}
        learningLanguages={onboarding.languages}
        translateTrigger={translateTrigger}
        entryId={todayEntry.id}
        initialTitle={todayEntry.title}
        initialBody={todayEntry.body ?? ""}
        initialTranslations={normalizeTranslations(todayEntry.translations)}
        pastEntries={pastEntries}
        initialEditEntryId={initialEditEntryId ?? null}
      />
    );
  }

  const user = await requireAppSession();
  const [{ entry: todayEntry, dailyPrompt }, entries, { source, target }, onboarding] =
    await Promise.all([
      getOrCreateJournalEntryForDate(user.id, new Date()).then(async (draft) => ({
        entry: draft.entry,
        dailyPrompt: await getDailyPromptForEntry(user.id, draft.entry.id),
      })),
      listJournalEntries(user.id),
      getLanguagePair(user.id),
      getOnboardingState(user.id),
    ]);

  const pastEntries = entries.filter((entry) =>
    isSavedJournalEntry(entry, todayEntry.id),
  );

  const name = journalGreetingName(onboarding.displayName, user.email);
  const greeting = t("greeting", {
    name: name === "there" ? t("greetingFallback") : name,
  });
  const subtitle = t(`subtitles.${encouragingSubtitleIndex()}`);

  return (
    <JournalWriteBody
      greeting={greeting}
      subtitle={subtitle}
      sourceLanguage={source}
      targetLanguage={target}
      learningLanguages={onboarding.languages}
      translateTrigger={translateTrigger}
      entryId={todayEntry.id}
      initialTitle={todayEntry.title}
      initialBody={todayEntry.body ?? ""}
      initialTranslations={normalizeTranslations(todayEntry.translations)}
      pastEntries={pastEntries}
      dailyPrompt={dailyPrompt}
      initialEditEntryId={initialEditEntryId ?? null}
    />
  );
}
