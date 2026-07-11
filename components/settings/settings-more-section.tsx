"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  SettingsPanelRow,
  SettingsSection,
} from "@/components/settings/settings-panel";
import { settingsFieldRowStartClassName } from "@/components/settings/settings-field-styles";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type SettingsMoreSectionProps = {
  previewMode?: boolean;
};

export function SettingsMoreSection({
  previewMode = false,
}: SettingsMoreSectionProps) {
  const t = useTranslations("settings.more");
  const tCommon = useTranslations("common");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/account", { method: "DELETE" });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? t("deleteFailed"));
        return;
      }
      window.location.href = "/";
    } catch {
      setError(t("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SettingsSection title={t("title")} titleInsidePanel>
      <SettingsPanelRow>
        <div className={settingsFieldRowStartClassName}>
          <Label className="pt-2">{t("logOut")}</Label>
          <div className="flex min-w-0 justify-end">
            <SignOutButton
              previewMode={previewMode}
              className={buttonVariants({ variant: "outline" })}
            >
              {previewMode ? tCommon("exitPreview") : tCommon("logOut")}
            </SignOutButton>
          </div>
        </div>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <div className={settingsFieldRowStartClassName}>
          <Label className="pt-2">{t("deleteAccount")}</Label>
          <div className="min-w-0 space-y-3">
            {previewMode ? (
              <p className="text-right text-sm text-muted-foreground">
                {t("previewDeleteUnavailable")}
              </p>
            ) : confirmingDelete ? (
              <>
                <p className="text-sm text-foreground">{t("deleteConfirm")}</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={deleting}
                    onClick={() => {
                      setConfirmingDelete(false);
                      setError(null);
                    }}
                  >
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleting}
                    onClick={() => void deleteAccount()}
                  >
                    {deleting ? t("deleting") : t("deleteAccount")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmingDelete(true)}
                >
                  {t("deleteAccount")}
                </Button>
              </div>
            )}
            {error ? (
              <p className="text-right text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </SettingsPanelRow>
    </SettingsSection>
  );
}
