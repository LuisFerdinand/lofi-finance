"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LayoutDashboard, ArrowLeftRight, PiggyBank, ListTodo } from "lucide-react";
import LogoMark from "@/components/layout/LogoMark";
import AuthBrandHeader from "@/components/layout/AuthBrandHeader";
import { APP_VERSION } from "@/lib/version";

const FEATURES = [
  { icon: LayoutDashboard, title: "Live Dashboard", desc: "See income, expenses, and trends at a glance." },
  { icon: ArrowLeftRight, title: "Transactions", desc: "Log income and expenses in seconds from your phone." },
  { icon: PiggyBank, title: "Savings Goals", desc: "Set targets and track your progress toward them." },
  { icon: ListTodo, title: "Projects & Todos", desc: "Organize tasks with list, kanban, and calendar views." },
];

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
    <div className="w-full max-w-sm md:max-w-4xl pixel-box-lg bg-card overflow-hidden animate-slide-up md:grid md:grid-cols-2">
      {/* Left — feature showcase, desktop only */}
      <div className="hidden md:flex flex-col justify-between bg-abyssal text-palladian p-8">
        <div>
          <div
            className="inline-flex items-center justify-center pixel-box bg-burning-flame mb-4"
            style={{ width: 56, height: 56 }}
          >
            <LogoMark size={34} />
          </div>
          <h1 className="font-pixel text-sm leading-loose text-palladian">
            LoFi<br />Finance
          </h1>
          <p className="font-mono text-xs text-oatmeal mt-2">your cozy money tracker</p>
        </div>

        <div className="space-y-5 my-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div
                className="pixel-box-sm bg-blue-fantastic flex items-center justify-center shrink-0"
                style={{ width: 32, height: 32 }}
              >
                <Icon size={16} className="text-burning-flame" />
              </div>
              <div>
                <p className="font-pixel text-xs text-palladian leading-tight">{title}</p>
                <p className="font-mono text-xs text-oatmeal mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="font-mono text-xs text-blue-fantastic">v{APP_VERSION} · lofi finance</p>
      </div>

      {/* Right — sign in form */}
      <div className="p-6 md:p-8 flex flex-col justify-center">
        {/* Mobile-only brand header (desktop shows branding in the left panel) */}
        <div className="md:hidden">
          <AuthBrandHeader />
        </div>

        <div className="bg-abyssal text-palladian px-3 py-2 -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6 flex items-center gap-2">
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
      </div>
    </div>
  );
}
