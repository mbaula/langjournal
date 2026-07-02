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

export const onboardingFlowDropdownListClassName =
  "max-h-72 overflow-y-auto rounded-2xl border border-border/80 bg-background p-1 shadow-sm";

const VIEWPORT_GUTTER = 16;
const ANCHOR_GAP = 8;

export type OnboardingDropdownPlacement = {
  top: number;
  left: number;
  minWidth: number;
};

function computeDropdownPlacement(
  anchor: DOMRect,
  menuHeight: number,
  menuWidth: number,
): OnboardingDropdownPlacement {
  let top = anchor.bottom + ANCHOR_GAP;
  if (top + menuHeight > window.innerHeight - VIEWPORT_GUTTER) {
    top = Math.max(VIEWPORT_GUTTER, anchor.top - menuHeight - ANCHOR_GAP);
  }

  const minWidth = anchor.width;
  let left = anchor.left;
  left = Math.max(
    VIEWPORT_GUTTER,
    Math.min(left, window.innerWidth - Math.max(minWidth, menuWidth) - VIEWPORT_GUTTER),
  );

  return { top, left, minWidth };
}

export function useOnboardingDropdownPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  menuRef: RefObject<HTMLElement | null>,
) {
  const [placement, setPlacement] = useState<OnboardingDropdownPlacement | null>(
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
    const frame = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, menuRef, open]);

  return placement;
}

type OnboardingFlowDropdownProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  listboxId: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
};

export function OnboardingFlowDropdown({
  open,
  anchorRef,
  listboxId,
  labelledBy,
  className,
  children,
}: OnboardingFlowDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const placement = useOnboardingDropdownPlacement(open, anchorRef, menuRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open || !placement) {
    return null;
  }

  return createPortal(
    <ul
      ref={menuRef}
      id={listboxId}
      role="listbox"
      aria-labelledby={labelledBy}
      style={{
        position: "fixed",
        top: placement.top,
        left: placement.left,
        minWidth: placement.minWidth,
        maxWidth: `min(calc(100vw - ${VIEWPORT_GUTTER * 2}px), 24rem)`,
        zIndex: 250,
      }}
      className={cn(onboardingFlowDropdownListClassName, "w-max", className)}
    >
      {children}
    </ul>,
    document.body,
  );
}
