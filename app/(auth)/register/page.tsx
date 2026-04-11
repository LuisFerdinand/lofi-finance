"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("passwords don't match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "registration failed"); return; }
      toast.success("account created! sign in now");
      router.push("/login");
    } catch {
      toast.error("something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pixel-box bg-card p-6 animate-slide-up">
      <div className="bg-abyssal text-palladian px-3 py-2 -mx-6 -mt-6 mb-6 flex items-center gap-2">
        <span className="font-pixel text-burning-flame text-xs">+</span>
        <span className="font-pixel text-xs">NEW PLAYER</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: "name", label: "NAME", type: "text", placeholder: "Your name" },
          { key: "email", label: "EMAIL", type: "email", placeholder: "you@example.com" },
          { key: "password", label: "PASSWORD", type: "password", placeholder: "min 8 characters" },
          { key: "confirm", label: "CONFIRM", type: "password", placeholder: "repeat password" },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label className="font-pixel text-xs block mb-2">{label}</label>
            <input
              type={type}
              required
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:border-burning-flame placeholder:text-muted-foreground"
              placeholder={placeholder}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full pixel-btn bg-burning-flame text-abyssal font-pixel text-xs py-3 mt-2 disabled:opacity-60"
        >
          {loading ? "LOADING..." : "► CREATE ACCOUNT"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          have an account?{" "}
          <Link href="/login" className="text-burning-flame underline hover:text-truffle">
            sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
