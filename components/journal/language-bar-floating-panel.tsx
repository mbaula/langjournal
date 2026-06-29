"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type FloatingPanelRect = {
  top: number;
  left: number;
  width: number;
};

const FLOATING_PANEL_MAX_WIDTH = 448; // 28rem
const FLOATING_PANEL_VIEWPORT_GUTTER = 16;

export function computeLanguagePickerRect(anchor: DOMRect): FloatingPanelRect {
  const width = Math.min(
    window.innerWidth - FLOATING_PANEL_VIEWPORT_GUTTER * 2,
    FLOATING_PANEL_MAX_WIDTH,
  );
  const left = Math.max(
    FLOATING_PANEL_VIEWPORT_GUTTER,
    Math.min(
      anchor.right - width,
      window.innerWidth - width - FLOATING_PANEL_VIEWPORT_GUTTER,
    ),
  );

  return { top: anchor.bottom + 8, left, width };
}

export function computeHelpPopoverRect(anchor: DOMRect): FloatingPanelRect {
  const width = Math.min(
    window.innerWidth - FLOATING_PANEL_VIEWPORT_GUTTER * 2,
    FLOATING_PANEL_MAX_WIDTH,
  );
  const mobile = window.matchMedia("(max-width: 639px)").matches;

  if (mobile) {
    const left = Math.max(
      FLOATING_PANEL_VIEWPORT_GUTTER,
      Math.min(
        anchor.left,
        window.innerWidth - width - FLOATING_PANEL_VIEWPORT_GUTTER,
      ),
    );
    return { top: anchor.bottom + 8, left, width };
  }

  const left = Math.min(
    anchor.right + 8,
    window.innerWidth - width - FLOATING_PANEL_VIEWPORT_GUTTER,
  );

  return { top: anchor.top, left, width };
}

function useFloatingPanelRect(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  compute: (anchor: DOMRect) => FloatingPanelRect,
) {
  const [rect, setRect] = useState<FloatingPanelRect | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      setRect(compute(anchor.getBoundingClientRect()));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, compute]);

  return rect;
}

type LanguageBarFloatingPanelProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  computeRect: (anchor: DOMRect) => FloatingPanelRect;
  className?: string;
  role?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  children: ReactNode;
};

export function LanguageBarFloatingPanel({
  open,
  anchorRef,
  panelRef,
  computeRect,
  className,
  role,
  ariaLabelledBy,
  ariaDescribedBy,
  children,
}: LanguageBarFloatingPanelProps) {
  const [mounted, setMounted] = useState(false);
  const rect = useFloatingPanelRect(open, anchorRef, computeRect);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open || !rect) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      role={role}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className={cn("fixed z-[200]", className)}
      style={{ top: rect.top, left: rect.left, width: rect.width }}
    >
      {children}
    </div>,
    document.body,
  );
}
