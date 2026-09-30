// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Press_Start_2P, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";

// Self-hosted at build time — no runtime request to Google, no FOUT. The CSS
// variables are consumed by --font-mono / --font-pixel in globals.css.
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-space-mono",
  display: "swap",
});
const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
  display: "swap",
});

const APP_NAME = "LoFi Finance";
const APP_DESCRIPTION =
  "A cozy lofi-styled workspace for your money and your work: track income, expenses, and trends on a live dashboard, log transactions in seconds, set and grow savings goals, and plan tasks and projects with list, kanban, and calendar views.";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | Personal Finance & Productivity Tracker`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "personal finance",
    "budget tracker",
    "expense tracker",
    "income tracker",
    "savings goals",
    "dashboard",
    "transactions",
    "task manager",
    "project management",
    "kanban",
    "calendar",
    "todo",
    "lofi",
  ],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} | Personal Finance & Productivity Tracker`,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${APP_NAME} | Personal Finance & Productivity Tracker`,
    description: APP_DESCRIPTION,
  },
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
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${spaceMono.variable} ${pressStart.variable}`}
    >
      <body className="antialiased">
        <SessionProvider refetchOnWindowFocus={false}>
          {children}
          <Toaster
            position="bottom-right"
            duration={6000}
            // Clear the fixed mobile bottom nav + FAB instead of covering them.
            mobileOffset={{ bottom: 88 }}
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--foreground)",
                border: "var(--pixel-border)",
                boxShadow: "var(--pixel-shadow-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                borderRadius: "0px",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}