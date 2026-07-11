"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export const anchoredFlowDropdownListClassName =
  "max-h-72 overflow-y-auto rounded-2xl border border-border/80 bg-background p-1 shadow-sm";

const VIEWPORT_GUTTER = 16;
const ANCHOR_GAP = 8;

export type AnchoredDropdownPlacement = {
  top: number;
  left: number;
  minWidth: number;
};

export function computeDropdownPlacement(
  anchor: DOMRect,
  menuHeight: number,
  menuWidth: number,
): AnchoredDropdownPlacement {
  const minWidth = anchor.width;
  let left = anchor.left;
  left = Math.max(
    VIEWPORT_GUTTER,
    Math.min(left, window.innerWidth - Math.max(minWidth, menuWidth) - VIEWPORT_GUTTER),
  );

  if (menuHeight <= 0) {
    return {
      top: anchor.bottom + ANCHOR_GAP,
      left,
      minWidth,
    };
  }

  const spaceBelow = anchor.bottom + ANCHOR_GAP + menuHeight + VIEWPORT_GUTTER;
  const spaceAbove = anchor.top - ANCHOR_GAP - menuHeight - VIEWPORT_GUTTER;
  const fitsBelow = spaceBelow <= window.innerHeight;
  const fitsAbove = spaceAbove >= 0;

  let top: number;
  if (fitsBelow) {
    top = anchor.bottom + ANCHOR_GAP;
  } else if (fitsAbove) {
    top = anchor.top - menuHeight - ANCHOR_GAP;
  } else {
    const roomBelow = window.innerHeight - anchor.bottom - VIEWPORT_GUTTER;
    const roomAbove = anchor.top - VIEWPORT_GUTTER;
    if (roomBelow >= roomAbove) {
      top = anchor.bottom + ANCHOR_GAP;
    } else {
      top = Math.max(VIEWPORT_GUTTER, anchor.top - menuHeight - ANCHOR_GAP);
    }
  }

  return { top, left, minWidth };
}

export function useAnchoredDropdownPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  menuRef: RefObject<HTMLElement | null>,
) {
  const [placement, setPlacement] = useState<AnchoredDropdownPlacement | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      if (!anchor) {
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      setPlacement(
        computeDropdownPlacement(
          anchorRect,
          menu?.offsetHeight ?? 0,
          menu?.offsetWidth ?? anchorRect.width,
        ),
      );
    };

    update();

    const observer = new ResizeObserver(update);
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (anchor) {
      observer.observe(anchor);
    }
    if (menu) {
      observer.observe(menu);
    }

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    const frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, menuRef, open]);

  return placement;
}

type AnchoredFlowDropdownProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  listboxId: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
};

export function AnchoredFlowDropdown({
  open,
  anchorRef,
  listboxId,
  labelledBy,
  className,
  children,
}: AnchoredFlowDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const placement = useAnchoredDropdownPlacement(open, anchorRef, menuRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) {
    return null;
  }

  const isMeasured = placement !== null;

  return createPortal(
    <ul
      ref={menuRef}
      id={listboxId}
      role="listbox"
      aria-labelledby={labelledBy}
      style={{
        position: "fixed",
        top: placement?.top ?? 0,
        left: placement?.left ?? 0,
        minWidth: placement?.minWidth,
        maxWidth: `min(calc(100vw - ${VIEWPORT_GUTTER * 2}px), 24rem)`,
        visibility: isMeasured ? "visible" : "hidden",
        zIndex: 250,
      }}
      className={cn(anchoredFlowDropdownListClassName, "w-max", className)}
    >
      {children}
    </ul>,
    document.body,
  );
}
