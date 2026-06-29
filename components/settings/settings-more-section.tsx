"use client";

import Link from "next/link";
import { useState } from "react";

import {
  SettingsPanelRow,
  SettingsSection,
} from "@/components/settings/settings-panel";
import { settingsFieldRowStartClassName } from "@/components/settings/settings-field-styles";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SettingsMoreSectionProps = {
  previewMode?: boolean;
};

export function SettingsMoreSection({
  previewMode = false,
}: SettingsMoreSectionProps) {
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
        setError(data.error ?? "Could not delete account");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Could not delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SettingsSection title="More" titleInsidePanel>
      <SettingsPanelRow>
        <div className={settingsFieldRowStartClassName}>
          <Label className="pt-2">Log out</Label>
          <div className="flex min-w-0 justify-end">
            <Link
              href={
                previewMode ? "/api/dev/exit-account-preview" : "/auth/signout"
              }
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              {previewMode ? "Exit preview" : "Log out"}
            </Link>
          </div>
        </div>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <div className={settingsFieldRowStartClassName}>
          <Label className="pt-2">Delete account</Label>
          <div className="min-w-0 space-y-3">
            {previewMode ? (
              <p className="text-right text-sm text-muted-foreground">
                Account deletion is unavailable in preview mode.
              </p>
            ) : confirmingDelete ? (
              <>
                <p className="text-sm text-foreground">
                  Delete your account permanently? All journal entries,
                  flashcards, and profile data will be removed. This cannot be
                  undone.
                </p>
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
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleting}
                    onClick={() => void deleteAccount()}
                  >
                    {deleting ? "Deleting…" : "Delete account"}
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
                  Delete account
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
