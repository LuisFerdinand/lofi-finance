// src/app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import TopBar from "@/components/layout/TopBar";
import GlobalAddButton from "@/components/transactions/GlobalAddButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-dvh bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar role={session.user.role} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={session.user} />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Floating add button — visible on every dashboard page */}
      <GlobalAddButton />

      {/* Mobile bottom nav */}
      <MobileNav role={session.user.role} />
    </div>
  );
}