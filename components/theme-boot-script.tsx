"use client";

import { useServerInsertedHTML } from "next/navigation";

type ThemeBootScriptProps = {
  script: string;
};

/** Injects the theme/accent boot script during SSR only (avoids React 19 script warnings). */
export function ThemeBootScript({ script }: ThemeBootScriptProps) {
  useServerInsertedHTML(() => (
    <script
      id="theme-boot"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  ));

  return null;
}
