import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { SettingsMoreSection } from "@/components/settings/settings-more-section";
import { SettingsPrivacySection } from "@/components/settings/settings-privacy-section";
import {
  appPageShellClassName,
  journalPageTitleClassName,
} from "@/components/journal/field-styles";
import { isAccountPreviewMode, requireUser } from "@/lib/auth/session";
import { getDevPreviewOnboardingState } from "@/lib/dev/preview-account";
import { getOnboardingState } from "@/lib/db/onboarding";

export default async function SettingsPage() {
  const preview = await isAccountPreviewMode();

  if (preview) {
    const onboarding = getDevPreviewOnboardingState();

    return (
      <div className={appPageShellClassName}>
        <header className="space-y-1">
          <h1 className={journalPageTitleClassName}>Settings</h1>
          <p className="text-sm text-muted-foreground">
            Update your profile and preferences.
          </p>
        </header>

        <SettingsPrivacySection />

        <ProfileSettingsForm initialState={onboarding} />

        <SettingsMoreSection previewMode />
      </div>
    );
  }

  const user = await requireUser("/app/settings");
  const onboarding = await getOnboardingState(user.id);

  return (
    <div className={appPageShellClassName}>
      <header className="space-y-1">
        <h1 className={journalPageTitleClassName}>Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update your profile and preferences.
        </p>
      </header>

      <SettingsPrivacySection />

      <ProfileSettingsForm initialState={onboarding} />

      <SettingsMoreSection />
    </div>
  );
}
