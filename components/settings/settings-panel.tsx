import { Children, Fragment, isValidElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const settingsPanelClassName =
  "overflow-hidden rounded-2xl border border-border bg-background";

export const settingsPanelRowClassName = "px-4 py-4";

export const settingsPanelDividerClassName = "mx-4 h-px bg-border";

export const settingsSectionTitleClassName =
  "text-lg font-semibold text-foreground";

type SettingsPanelProps = {
  children: ReactNode;
  className?: string;
};

export function SettingsPanelDivider() {
  return <div className={settingsPanelDividerClassName} role="presentation" />;
}

export function SettingsPanel({ children, className }: SettingsPanelProps) {
  const rows = Children.toArray(children);

  return (
    <div className={cn(settingsPanelClassName, className)}>
      {rows.map((child, index) => (
        <Fragment key={isValidElement(child) && child.key != null ? child.key : index}>
          {index > 0 ? <SettingsPanelDivider /> : null}
          {child}
        </Fragment>
      ))}
    </div>
  );
}

type SettingsPanelRowProps = {
  children: ReactNode;
  className?: string;
};

export function SettingsPanelRow({ children, className }: SettingsPanelRowProps) {
  return (
    <div className={cn(settingsPanelRowClassName, className)}>{children}</div>
  );
}

type SettingsSectionProps = {
  title: string;
  titleInsidePanel?: boolean;
  children: ReactNode;
};

export function SettingsSection({
  title,
  titleInsidePanel = false,
  children,
}: SettingsSectionProps) {
  if (titleInsidePanel) {
    return (
      <section>
        <SettingsPanel>
          <SettingsPanelRow>
            <h2 className={settingsSectionTitleClassName}>{title}</h2>
          </SettingsPanelRow>
          {children}
        </SettingsPanel>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className={settingsSectionTitleClassName}>{title}</h2>
      <SettingsPanel>{children}</SettingsPanel>
    </section>
  );
}
