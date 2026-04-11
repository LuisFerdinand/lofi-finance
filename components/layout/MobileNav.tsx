"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { LayoutDashboard, ArrowLeftRight, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "HOME", icon: LayoutDashboard, role: ["admin", "user"] },
  { href: "/transactions", label: "TXN", icon: ArrowLeftRight, role: ["admin", "user"] },
  { href: "/admin", label: "ADMIN", icon: Users, role: ["admin"] },
];

export default function MobileNav({ role }: { role: "admin" | "user" }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-abyssal border-t-2 border-abyssal z-50 flex">
      {navItems
        .filter((i) => i.role.includes(role))
        .map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 gap-1 font-pixel text-xs transition-all",
                isActive
                  ? "text-burning-flame bg-blue-fantastic"
                  : "text-oatmeal"
              )}
            >
              <item.icon size={16} />
              <span style={{ fontSize: "7px" }}>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
