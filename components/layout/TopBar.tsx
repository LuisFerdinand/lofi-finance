"use client";

import { signOut } from "next-auth/react";
import { getInitials } from "@/utils";
import { LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  user: { name?: string | null; email?: string | null; role: string };
}

export default function TopBar({ user }: TopBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-card border-b-2 border-border px-4 md:px-6 py-3 flex items-center justify-between">
      {/* Page title placeholder - filled by each page via context if needed */}
      <div className="flex items-center gap-2">
        <span className="font-pixel text-xs text-muted-foreground hidden sm:block">
          LoFi Finance
        </span>
        <span className="font-pixel text-xs text-muted-foreground animate-pixel-blink">_</span>
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 pixel-btn bg-background px-3 py-2"
        >
          {/* Avatar */}
          <div className="w-6 h-6 bg-burning-flame flex items-center justify-center border border-abyssal">
            <span className="font-pixel text-abyssal" style={{ fontSize: "6px" }}>
              {getInitials(user.name ?? "U")}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="font-pixel text-xs leading-none">{user.name}</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">{user.role}</p>
          </div>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 bg-card pixel-box z-20 animate-slide-up">
              <div className="p-3 border-b border-border">
                <p className="font-pixel text-xs truncate">{user.name}</p>
                <p className="font-mono text-xs text-muted-foreground truncate mt-1">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-3 font-pixel text-xs text-truffle hover:bg-muted transition-colors"
              >
                <LogOut size={12} />
                SIGN OUT
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
