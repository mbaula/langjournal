"use client";

import { Pause, Volume2 } from "lucide-react";
import { type ComponentProps, forwardRef, useCallback } from "react";

import { useTextToSpeech } from "@/lib/speech/use-text-to-speech";
import { cn } from "@/lib/utils";

type InlineListenButtonProps = Omit<ComponentProps<"button">, "children"> & {
  text: string;
  languageCode: string;
  size?: "sm" | "md";
};

export const InlineListenButton = forwardRef<
  HTMLButtonElement,
  InlineListenButtonProps
>(function InlineListenButton(
  { text, languageCode, size = "md", disabled, className, onClick, ...props },
  ref,
) {
  const { toggle, state, supported } = useTextToSpeech();

  const isSpeaking = state === "speaking";
  const hasText = text.trim().length > 0;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      toggle(text, languageCode);
    },
    [toggle, text, languageCode, onClick],
  );

  if (!supported) {
    return null;
  }

  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  const buttonSize =
    size === "sm"
      ? "size-6 rounded-md"
      : "size-7 rounded-md";

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || !hasText}
      onClick={handleClick}
      aria-label={isSpeaking ? "Stop" : "Listen"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
        buttonSize,
        isSpeaking && "text-primary",
        className,
      )}
      {...props}
    >
      {isSpeaking ? (
        <Pause className={iconSize} strokeWidth={1.5} />
      ) : (
        <Volume2 className={iconSize} strokeWidth={1.5} />
      )}
    </button>
  );
});
