// components/layout/SidebarContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const COLLAPSE_KEY = "lofi:sidebarCollapsed";

interface SidebarContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

// Shared collapse state for the desktop Sidebar — the toggle control itself
// lives in TopBar, so both need to read/flip the same state.
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Reads external (non-React) state on mount to avoid an SSR/hydration
    // mismatch — the server has no localStorage, so it always renders
    // expanded first, then this corrects to the persisted value client-side.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}
