"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export function LandingMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>(".landing-enter");
    for (const node of nodes) {
      node.style.animation = "none";
      void node.offsetHeight;
      node.style.animation = "";
    }
  }, [pathname]);

  return children;
}
