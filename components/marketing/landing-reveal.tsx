"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger entrance after the reveal triggers. */
  delayMs?: number;
  from?: "below" | "above";
  /** When true, visibility follows scroll — fades in on enter, out on leave. */
  followScroll?: boolean;
};

export function LandingReveal({
  children,
  className,
  delayMs = 0,
  from = "below",
  followScroll = false,
}: LandingRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (followScroll) {
          setVisible(entry?.isIntersecting ?? false);
          return;
        }

        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-8% 0px -8% 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [followScroll]);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: visible && delayMs > 0 ? `${delayMs}ms` : "0ms",
      }}
      className={cn(
        "landing-reveal",
        from === "above" ? "landing-reveal-from-above" : "landing-reveal-from-below",
        visible && "landing-reveal-visible",
        className,
      )}
    >
      {children}
    </div>
  );
}
