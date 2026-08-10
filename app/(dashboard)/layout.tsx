// src/app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import TopBar from "@/components/layout/TopBar";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SidebarProvider>
      {/* h-dvh + overflow-hidden so only <main> scrolls internally — the
          sidebar and top bar then sit structurally outside the scroll flow
          and stay put the same way the fixed MobileNav does, instead of
          relying on `sticky` (which only holds for one viewport's worth of
          scroll and creates a stacking context that traps fixed-position
          descendants like Tooltip behind later siblings). */}
      <div className="h-dvh bg-background flex flex-col md:flex-row overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar role={session.user.role} />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <TopBar user={session.user} />
          <main className="flex-1 min-h-0 p-4 md:p-6 pb-28 md:pb-6 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav role={session.user.role} />
      </div>
    </SidebarProvider>
  );
}