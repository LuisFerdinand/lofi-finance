"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import FabButton from "@/components/ui/FabButton";
import Modal from "@/components/ui/Modal";

export default function AddUserButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex pixel-btn bg-burning-flame text-abyssal font-pixel px-4 py-2 items-center gap-2 shrink-0"
        style={{ fontSize: "11px" }}
      >
        <UserPlus size={12} />
        ADD USER
      </button>
      <FabButton icon={UserPlus} label="add user" onClick={() => setOpen(true)} />
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "failed to create user");
      toast.success("user created!");
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="CREATE USER">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {[
            { key: "name", label: "NAME", type: "text", placeholder: "Full name" },
            { key: "email", label: "EMAIL", type: "email", placeholder: "user@email.com" },
            { key: "password", label: "PASSWORD", type: "password", placeholder: "min 8 characters" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="font-pixel block mb-1" style={{ fontSize: "10px" }}>{label}</label>
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
            <label className="font-pixel block mb-1" style={{ fontSize: "10px" }}>ROLE</label>
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
                  style={{ fontSize: "11px" }}
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
            style={{ fontSize: "11px" }}
          >
            {loading ? "CREATING..." : "► CREATE USER"}
          </button>
        </form>
    </Modal>
  );
}
