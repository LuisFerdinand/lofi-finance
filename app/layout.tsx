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
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="antialiased">
        <SessionProvider>
          {children}
          <Toaster
            position="bottom-right"
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