// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { LayoutDashboard, ArrowLeftRight, Users } from "lucide-react";
import LogoMark from "./LogoMark";

const navItems = [
  { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard, role: ["admin", "user"] },
  { href: "/transactions", label: "TRANSACTIONS", icon: ArrowLeftRight, role: ["admin", "user"] },
  { href: "/admin", label: "ADMIN", icon: Users, role: ["admin"] },
];

export default function Sidebar({ role }: { role: "admin" | "user" }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 bg-abyssal text-palladian border-r-2 border-abyssal shrink-0">
      {/* Logo */}
      <div className="p-5 border-b-2 border-blue-fantastic">
        <div className="flex items-center gap-3">
          <div
            className="pixel-box-sm bg-burning-flame flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40 }}
          >
            <LogoMark size={24} />
          </div>
          <div>
            <p className="font-pixel text-xs text-burning-flame leading-tight">LoFi</p>
            <p className="font-pixel text-xs text-palladian leading-tight">Finance</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems
          .filter((item) => item.role.includes(role))
          .map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 font-pixel text-xs transition-all",
                  isActive
                    ? "bg-burning-flame text-abyssal pixel-box-sm"
                    : "text-oatmeal hover:text-burning-flame hover:bg-blue-fantastic"
                )}
              >
                <item.icon size={12} />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
      </nav>

      {/* Version */}
      <div className="p-4 border-t-2 border-blue-fantastic">
        <p className="font-pixel text-xs text-blue-fantastic">v0.1.0</p>
        <p className="font-mono text-xs text-blue-fantastic mt-1">lofi finance</p>
      </div>
    </aside>
  );
}