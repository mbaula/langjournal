"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export const slashTranslateHintClassName =
  "pointer-events-none fixed z-[250] max-w-[min(calc(100vw-2rem),14rem)] rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium leading-snug text-foreground shadow-sm sm:max-w-none sm:whitespace-nowrap";

const VIEWPORT_GUTTER = 16;
const ANCHOR_GAP = 4;

export function computeHintPlacement(
  anchor: DOMRect,
  hintWidth: number,
  hintHeight: number,
) {
  let top = anchor.bottom + ANCHOR_GAP;
  if (top + hintHeight > window.innerHeight - VIEWPORT_GUTTER) {
    top = anchor.top - hintHeight - ANCHOR_GAP;
  }

  let left = anchor.left;
  left = Math.max(
    VIEWPORT_GUTTER,
    Math.min(left, window.innerWidth - hintWidth - VIEWPORT_GUTTER),
  );

  return { top, left };
}

type SlashTranslateHintProps = {
  anchorRef: RefObject<HTMLSpanElement | null>;
  hint: string;
  layoutKey: string;
};

export function SlashTranslateHint({
  anchorRef,
  hint,
  layoutKey,
}: SlashTranslateHintProps) {
  const [mounted, setMounted] = useState(false);
  const [placement, setPlacement] = useState<{ top: number; left: number } | null>(
    null,
  );
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;

    let rafId = 0;
    let attempts = 0;

    const update = () => {
      const anchor = anchorRef.current;
      const hintEl = hintRef.current;
      if (!anchor || !hintEl) {
        // Anchor/portal may not be ready on the first `//` frame — retry briefly.
        if (attempts < 8) {
          attempts += 1;
          rafId = window.requestAnimationFrame(update);
        }
        return;
      }

      setPlacement(
        computeHintPlacement(
          anchor.getBoundingClientRect(),
          hintEl.offsetWidth,
          hintEl.offsetHeight,
        ),
      );
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [mounted, anchorRef, hint, layoutKey]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      ref={hintRef}
      className={cn(slashTranslateHintClassName, !placement && "invisible")}
      style={
        placement
          ? { top: placement.top, left: placement.left }
          : { top: 0, left: 0 }
      }
      aria-hidden
    >
      {hint}
    </div>,
    document.body,
  );
}
