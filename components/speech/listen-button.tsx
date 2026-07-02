"use client";

import { Pause, Volume2 } from "lucide-react";
import { type ComponentProps, forwardRef, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { useTextToSpeech } from "@/lib/speech/use-text-to-speech";
import { cn } from "@/lib/utils";

type ListenButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  text: string;
  languageCode: string;
  label?: string;
  showLabel?: boolean;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
};

export const ListenButton = forwardRef<HTMLButtonElement, ListenButtonProps>(
  function ListenButton(
    {
      text,
      languageCode,
      label,
      showLabel = false,
      disabled,
      className,
      onSpeechStart,
      onSpeechEnd,
      ...props
    },
    ref,
  ) {
    const { toggle, state, supported } = useTextToSpeech();

    const isSpeaking = state === "speaking";
    const hasText = text.trim().length > 0;

    const handleClick = useCallback(() => {
      if (isSpeaking) {
        onSpeechEnd?.();
      } else {
        onSpeechStart?.();
      }
      toggle(text, languageCode);
    }, [isSpeaking, toggle, text, languageCode, onSpeechStart, onSpeechEnd]);

    if (!supported) {
      return null;
    }

    const accessibleLabel =
      label ?? (isSpeaking ? "Stop listening" : "Listen");

    return (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        size={showLabel ? "sm" : "icon-sm"}
        disabled={disabled || !hasText}
        onClick={handleClick}
        aria-label={accessibleLabel}
        className={cn(
          "text-muted-foreground hover:text-foreground",
          isSpeaking && "text-primary",
          className,
        )}
        {...props}
      >
        {isSpeaking ? (
          <Pause className="size-4" strokeWidth={1.5} />
        ) : (
          <Volume2 className="size-4" strokeWidth={1.5} />
        )}
        {showLabel ? (
          <span className="ml-1">{isSpeaking ? "Stop" : "Listen"}</span>
        ) : null}
      </Button>
    );
  },
);
