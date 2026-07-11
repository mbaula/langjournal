"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";

import { appNavUtilityButtonClass } from "@/components/app/app-nav-styles";
import { getTallyFeedbackFormId } from "@/lib/feedback/tally";
import { cn } from "@/lib/utils";

const TALLY_EMBED_SCRIPT_SRC = "https://tally.so/widgets/embed.js";

let tallyEmbedScriptRequested = false;

function ensureTallyEmbedScript() {
  if (typeof window === "undefined" || tallyEmbedScriptRequested) {
    return;
  }

  tallyEmbedScriptRequested = true;

  if (document.querySelector(`script[src="${TALLY_EMBED_SCRIPT_SRC}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.src = TALLY_EMBED_SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

type FeedbackButtonProps = {
  variant?: "nav" | "sidebar" | "marketing";
  className?: string;
};

type FeedbackInlineLinkProps = {
  className?: string;
  children?: ReactNode;
};

export function FeedbackInlineLink({
  className,
  children,
}: FeedbackInlineLinkProps) {
  const t = useTranslations("feedback");
  const formId = getTallyFeedbackFormId();
  const label = children ?? t("clickHere");

  useEffect(() => {
    if (!formId) {
      return;
    }
    ensureTallyEmbedScript();
  }, [formId]);

  if (!formId) {
    return <span className={className}>{label}</span>;
  }

  return (
    <button
      type="button"
      data-tally-open={formId}
      data-tally-layout="modal"
      className={cn(
        "font-inherit text-inherit underline decoration-current/40 underline-offset-2 transition-colors hover:decoration-current/70",
        className,
      )}
    >
      {label}
    </button>
  );
}

export function FeedbackButton({
  variant = "nav",
  className,
}: FeedbackButtonProps) {
  const t = useTranslations("feedback");
  const formId = getTallyFeedbackFormId();

  useEffect(() => {
    if (!formId) {
      return;
    }
    ensureTallyEmbedScript();
  }, [formId]);

  if (!formId) {
    return null;
  }

  if (variant === "marketing") {
    return (
      <button
        type="button"
        data-tally-open={formId}
        data-tally-layout="modal"
        className={cn(
          "rounded-md px-2 py-1.5 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-base",
          className,
        )}
      >
        {t("label")}
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        data-tally-open={formId}
        data-tally-layout="modal"
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/25 px-2 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80",
          className,
        )}
      >
        <MessageSquare className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
        {t("label")}
      </button>
    );
  }

  return (
    <button
      type="button"
      data-tally-open={formId}
      data-tally-layout="modal"
      className={cn(appNavUtilityButtonClass, className)}
    >
      <MessageSquare className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
      {t("label")}
    </button>
  );
}
