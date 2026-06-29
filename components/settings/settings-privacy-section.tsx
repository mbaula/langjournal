import {
  SettingsPanelRow,
  SettingsSection,
} from "@/components/settings/settings-panel";

export function SettingsPrivacySection() {
  return (
    <SettingsSection title="Privacy">
      <SettingsPanelRow>
        <p className="text-sm text-muted-foreground">
          Your journal entries, flashcards, and profile data are private to your
          account. We do not share your writing with third parties and we do not train our own models on your content.
        </p>
      </SettingsPanelRow>
    </SettingsSection>
  );
}
