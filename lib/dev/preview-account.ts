import type { AppUser } from "@/lib/auth/session";
import type { OnboardingState } from "@/lib/db/onboarding";
import type {
  ContributionDay,
  JournalStats,
} from "@/lib/entries/service";
import type {
  FlashcardPracticeStats,
  FlashcardRecord,
} from "@/lib/flashcards/types";
import { isDevEnvironment } from "@/lib/dev/preview";

export const DEV_ACCOUNT_PREVIEW_COOKIE = "dev-preview-account";
export const DEV_ACCOUNT_PREVIEW_PARAM = "account";

export const DEV_PREVIEW_USER_ID = "00000000-0000-0000-0000-000000000099";
export const DEV_PREVIEW_ENTRY_ID = "00000000-0000-0000-0000-000000000001";

export function isDevAccountPreviewCookie(value: string | undefined): boolean {
  return isDevEnvironment() && value === "1";
}

export function getDevPreviewUser(): AppUser {
  return {
    id: DEV_PREVIEW_USER_ID,
    email: "alex.preview@folio.local",
  };
}

export function getDevPreviewOnboardingState(): OnboardingState {
  return {
    displayName: "Alex",
    ageRange: "25_34",
    languages: [{ languageCode: "fr", level: "intermediate" }],
    isComplete: true,
  };
}

export function getDevPreviewLanguageProfile() {
  return {
    userId: DEV_PREVIEW_USER_ID,
    nativeLanguage: "en",
    targetLanguage: "fr",
  };
}

export function getDevPreviewLanguagePair() {
  return { source: "en", target: "fr" };
}

function daysAgoUtc(days: number): Date {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - days),
  );
}

export function getDevPreviewJournalEntries() {
  const now = new Date();
  return [
    {
      id: DEV_PREVIEW_ENTRY_ID,
      title: "A walk along the Seine",
      body: "Aujourd'hui j'ai marché le long de la rivière. Le temps était //sunny et j'ai pris un café en terrasse.",
      translations: [],
      entryDate: daysAgoUtc(0),
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      title: null,
      body: "J'ai révisé le subjonctif pendant une heure. C'est difficile mais //progress.",
      translations: [],
      entryDate: daysAgoUtc(2),
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      flashcardCount: 1,
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      title: "Weekend notes",
      body: "Ce week-end j'ai lu un chapitre de mon livre préféré en français.",
      translations: [],
      entryDate: daysAgoUtc(5),
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      flashcardCount: 3,
    },
  ];
}

export function getDevPreviewJournalStats(): JournalStats {
  return {
    total: 12,
    translationCount: 28,
    thisWeek: 3,
    thisMonth: 8,
    learningLanguages: [{ languageCode: "fr", level: "intermediate" }],
  };
}

export function getDevPreviewContributionData(): ContributionDay[] {
  const days: ContributionDay[] = [];
  for (let i = 364; i >= 0; i -= 1) {
    const d = daysAgoUtc(i);
    const date = d.toISOString().slice(0, 10);
    const count = i % 7 === 0 || i % 11 === 0 ? 1 : 0;
    days.push({ date, count });
  }
  return days;
}

export function getDevPreviewSidebarRecents() {
  return getDevPreviewJournalEntries().map((e) => {
    const title = e.title?.trim() ? e.title.trim() : null;
    return {
      id: e.id,
      title,
      entryDate: e.entryDate.toISOString(),
      bodyPreview: title
        ? ""
        : (e.body?.slice(0, 80) ?? ""),
    };
  });
}

export function getDevPreviewFlashcards(): FlashcardRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: "00000000-0000-0000-0000-000000000101",
      word: "ensoleillé",
      translation: "sunny",
      exampleSentence:
        "Aujourd'hui j'ai marché le long de la rivière. Le temps était ensoleillé et j'ai pris un café en terrasse.",
      hasAudio: false,
      audioMimeType: null,
      languageCode: "fr",
      proficiency: "NEW",
      entryId: DEV_PREVIEW_ENTRY_ID,
      entryTitle: "A walk along the Seine",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "00000000-0000-0000-0000-000000000102",
      word: "progrès",
      translation: "progress",
      exampleSentence:
        "J'ai révisé le subjonctif pendant une heure. C'est difficile mais progrès.",
      hasAudio: false,
      audioMimeType: null,
      languageCode: "fr",
      proficiency: "LEARNING",
      entryId: "00000000-0000-0000-0000-000000000002",
      entryTitle: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "00000000-0000-0000-0000-000000000103",
      word: "chapitre",
      translation: "chapter",
      exampleSentence:
        "Ce week-end j'ai lu un chapitre de mon livre préféré en français.",
      hasAudio: false,
      audioMimeType: null,
      languageCode: "fr",
      proficiency: "FAMILIAR",
      entryId: "00000000-0000-0000-0000-000000000003",
      entryTitle: "Weekend notes",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function getDevPreviewFlashcardStats(): FlashcardPracticeStats {
  return {
    currentStreak: 3,
    lastPracticeDate: new Date().toISOString().slice(0, 10),
  };
}
