"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("invalid credentials");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pixel-box bg-card p-6 animate-slide-up">
      {/* Header bar */}
      <div className="bg-abyssal text-palladian px-3 py-2 -mx-6 -mt-6 mb-6 flex items-center gap-2">
        <span className="font-pixel text-burning-flame text-xs">▶</span>
        <span className="font-pixel text-xs">SIGN IN</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-pixel text-xs text-foreground block mb-2">
            EMAIL
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-burning-flame placeholder:text-muted-foreground"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="font-pixel text-xs text-foreground block mb-2">
            PASSWORD
          </label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-burning-flame placeholder:text-muted-foreground"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full pixel-btn bg-burning-flame text-abyssal font-pixel text-xs py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "LOADING..." : "► START"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          no account?{" "}
          <Link
            href="/register"
            className="text-burning-flame underline hover:text-truffle"
          >
            register here
          </Link>
        </p>
      </div>

      {/* Demo credentials hint */}
      <div className="mt-4 border border-dashed border-oatmeal p-3 bg-muted">
        <p className="font-pixel text-xs text-muted-foreground mb-1">DEMO</p>
        <p className="font-mono text-xs text-foreground">
          admin@lofifinance.com / admin123
        </p>
        <p className="font-mono text-xs text-foreground">
          alex@lofifinance.com / user123
        </p>
      </div>
    </div>
  );
}
