"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export const PAST_ENTRY_EXPAND_MS = 320;

type PastEntryExpandPanelProps = {
  open: boolean;
  onCloseComplete?: () => void;
  children: React.ReactNode;
};

export function PastEntryExpandPanel({
  open,
  onCloseComplete,
  children,
}: PastEntryExpandPanelProps) {
  const [mounted, setMounted] = useState(open);
  const [expanded, setExpanded] = useState(false);
  const wasOpenRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }

      wasOpenRef.current = true;
      setMounted(true);
      const frame = requestAnimationFrame(() => setExpanded(true));
      return () => cancelAnimationFrame(frame);
    }

    if (!wasOpenRef.current) {
      return undefined;
    }

    wasOpenRef.current = false;
    setExpanded(false);

    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setMounted(false);
      onCloseComplete?.();
    }, PAST_ENTRY_EXPAND_MS);

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [open, onCloseComplete]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,margin] ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded ? "mb-0 grid-rows-[1fr]" : "mb-0 grid-rows-[0fr]",
      )}
      style={{ transitionDuration: `${PAST_ENTRY_EXPAND_MS}ms` }}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "origin-top transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]",
            expanded
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-[0.985] opacity-0",
          )}
          style={{ transitionDuration: `${PAST_ENTRY_EXPAND_MS}ms` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
