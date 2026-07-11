import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale/locale-switcher";
import {
  SettingsPanel,
  SettingsPanelRow,
  settingsSectionTitleClassName,
} from "@/components/settings/settings-panel";
import { Label } from "@/components/ui/label";
import { settingsFieldRowClassName } from "@/components/settings/settings-field-styles";

export async function DisplayLanguageSection() {
  const t = await getTranslations("settings.displayLanguage");

  return (
    <section className="flex flex-col gap-3">
      <div className="space-y-1">
        <h2 className={settingsSectionTitleClassName}>{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <SettingsPanel>
        <SettingsPanelRow>
          <div className={settingsFieldRowClassName}>
            <Label htmlFor="display-language">{t("label")}</Label>
            <LocaleSwitcher variant="settings" />
          </div>
        </SettingsPanelRow>
      </SettingsPanel>
    </section>
  );
}
