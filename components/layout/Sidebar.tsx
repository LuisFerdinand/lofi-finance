// components/layout/Sidebar.tsx
"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  PiggyBank,
  ListTodo,
} from "lucide-react";
import LogoMark from "./LogoMark";
import Tooltip from "@/components/ui/Tooltip";
import { useSidebar } from "./SidebarContext";
import { APP_VERSION } from "@/lib/version";

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard, role: ["admin", "user"] },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { href: "/transactions", label: "TRANSACTIONS", icon: ArrowLeftRight, role: ["admin", "user"] },
      { href: "/goals", label: "GOALS", icon: PiggyBank, role: ["admin", "user"] },
    ],
  },
  {
    label: "WORK",
    items: [
      { href: "/projects", label: "PROJECTS", icon: ListTodo, role: ["admin", "user"] },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/admin", label: "ADMIN", icon: Users, role: ["admin"] },
    ],
  },
];

export default function Sidebar({ role }: { role: "admin" | "user" }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-abyssal text-palladian border-r-2 border-abyssal shrink-0",
        "h-full transition-[width] duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("p-5 border-b-2 border-blue-fantastic shrink-0", collapsed && "px-3")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div
            className="pixel-box-sm bg-burning-flame flex items-center justify-center shrink-0"
            style={{ width: 36, height: 36 }}
          >
            <LogoMark size={24} />
          </div>
          {!collapsed && (
            <div>
              <p className="font-pixel text-xs text-burning-flame leading-tight">LoFi</p>
              <p className="font-pixel text-xs text-palladian leading-tight">Finance</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav — grouped sections */}
      <nav className={cn("flex-1 min-h-0 p-4 space-y-4 overflow-y-auto", collapsed && "px-2")}>
        {navGroups.map((group) => {
          const items = group.items.filter((item) => item.role.includes(role));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="space-y-1">
              {!collapsed && (
                <p className="font-pixel text-blue-fantastic px-3 mb-1" style={{ fontSize: "7px" }}>
                  {group.label}
                </p>
              )}
              {items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const linkContent = (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 font-pixel text-xs transition-all",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-burning-flame text-abyssal pixel-box-sm"
                        : "text-oatmeal hover:text-burning-flame hover:bg-blue-fantastic"
                    )}
                  >
                    <item.icon size={12} />
                    {!collapsed && <span className="leading-none">{item.label}</span>}
                  </Link>
                );
                return collapsed ? (
                  <Tooltip key={item.href} label={item.label}>{linkContent}</Tooltip>
                ) : (
                  <Fragment key={item.href}>{linkContent}</Fragment>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Version footer */}
      <div className={cn("p-4 border-t-2 border-blue-fantastic shrink-0", collapsed && "px-2 text-center")}>
        {collapsed ? (
          <p className="font-pixel text-blue-fantastic" style={{ fontSize: "7px" }}>v{APP_VERSION}</p>
        ) : (
          <>
            <p className="font-pixel text-xs text-blue-fantastic">v{APP_VERSION}</p>
            <p className="font-mono text-xs text-blue-fantastic mt-1">lofi finance</p>
          </>
        )}
      </div>
    </aside>
  );
}
