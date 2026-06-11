"use client";

import { createContext, useContext } from "react";

type SidebarShellContextValue = {
  isMobile: boolean;
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
};

const SidebarShellContext = createContext<SidebarShellContextValue | null>(
  null,
);

export function SidebarShellProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SidebarShellContextValue;
}) {
  return (
    <SidebarShellContext.Provider value={value}>
      {children}
    </SidebarShellContext.Provider>
  );
}

export function useSidebarShell(): SidebarShellContextValue | null {
  return useContext(SidebarShellContext);
}
