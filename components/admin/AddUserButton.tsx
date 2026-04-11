"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";

export default function AddUserButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pixel-btn bg-burning-flame text-abyssal font-pixel px-4 py-2 flex items-center gap-2 shrink-0"
        style={{ fontSize: "9px" }}
      >
        <UserPlus size={12} />
        ADD USER
      </button>
      {open && <AddUserModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("user created!");
      router.refresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-abyssal/70 z-50 flex items-end md:items-center justify-center p-4">
      <div className="pixel-box bg-card w-full max-w-md animate-slide-up">
        <div className="bg-abyssal text-palladian px-4 py-3 flex items-center justify-between">
          <span className="font-pixel text-xs">CREATE USER</span>
          <button onClick={onClose} className="text-oatmeal hover:text-burning-flame">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {[
            { key: "name", label: "NAME", type: "text", placeholder: "Full name" },
            { key: "email", label: "EMAIL", type: "email", placeholder: "user@email.com" },
            { key: "password", label: "PASSWORD", type: "password", placeholder: "min 8 characters" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>{label}</label>
              <input
                type={type}
                required
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none"
                placeholder={placeholder}
              />
            </div>
          ))}

          <div>
            <label className="font-pixel block mb-1" style={{ fontSize: "8px" }}>ROLE</label>
            <div className="flex gap-2">
              {(["user", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 pixel-btn font-pixel py-2 ${
                    form.role === r
                      ? r === "admin"
                        ? "bg-burning-flame text-abyssal"
                        : "bg-abyssal text-palladian"
                      : "bg-background text-foreground"
                  }`}
                  style={{ fontSize: "9px" }}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full pixel-btn bg-burning-flame text-abyssal font-pixel py-3 disabled:opacity-60"
            style={{ fontSize: "9px" }}
          >
            {loading ? "CREATING..." : "► CREATE USER"}
          </button>
        </form>
      </div>
    </div>
  );
}
