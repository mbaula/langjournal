import { getTranslations } from "next-intl/server";

import {
  SettingsPanelRow,
  SettingsSection,
} from "@/components/settings/settings-panel";

export async function SettingsPrivacySection() {
  const t = await getTranslations("settings.privacy");

  return (
    <SettingsSection title={t("title")}>
      <SettingsPanelRow>
        <p className="text-sm text-muted-foreground">{t("body")}</p>
      </SettingsPanelRow>
    </SettingsSection>
  );
}
