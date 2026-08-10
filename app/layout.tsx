// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "LoFi Finance | Personal Finance Tracker",
  description: "Track your income and expenses with a cozy lofi aesthetic",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1b2632",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No component in this app calls useSession() — user info comes from
  // each protected layout's own server-side auth() call instead — so
  // SessionProvider exists here only to make signIn()/signOut() work.
  // Its default behavior still re-fetches GET /api/auth/session on every
  // window/tab focus though, which is a serverless invocation for zero
  // benefit given nothing reads that state. Disabling it is a straight
  // cut with no functional loss. (Deliberately NOT fetching the session
  // server-side here to hand it down as an initial value — that would
  // require this layout to read cookies via auth(), which would make
  // Next mark every route under it, including the static /login and
  // /register pages, as dynamic — trading a bigger, ongoing cost for a
  // smaller one.)
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="antialiased">
        <SessionProvider refetchOnWindowFocus={false}>
          {children}
          <Toaster
            position="bottom-right"
            duration={6000}
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--foreground)",
                border: "var(--pixel-border)",
                boxShadow: "var(--pixel-shadow-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                borderRadius: "0px",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}