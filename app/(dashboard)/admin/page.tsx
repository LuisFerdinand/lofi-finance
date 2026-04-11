import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers, getUserStats } from "@/utils/users";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AddUserButton from "@/components/admin/AddUserButton";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const [userList, stats] = await Promise.all([
    getAllUsers(),
    getUserStats(),
  ]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-pixel text-sm leading-relaxed">USER ADMIN</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            manage players &amp; roles
          </p>
        </div>
        <AddUserButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TOTAL", value: stats.total, bg: "bg-abyssal", text: "text-palladian" },
          { label: "ACTIVE", value: stats.active, bg: "bg-blue-fantastic", text: "text-palladian" },
          { label: "ADMINS", value: stats.admins, bg: "bg-burning-flame", text: "text-abyssal" },
          { label: "USERS", value: stats.users, bg: "bg-oatmeal", text: "text-abyssal" },
        ].map((s) => (
          <div key={s.label} className={`pixel-box ${s.bg} ${s.text} p-4`}>
            <p className="font-pixel leading-none mb-2" style={{ fontSize: "7px" }}>{s.label}</p>
            <p className="font-pixel text-lg">{s.value}</p>
          </div>
        ))}
      </div>

      {/* User table */}
      <AdminUserTable users={userList} currentUserId={session.user.id} />
    </div>
  );
}
