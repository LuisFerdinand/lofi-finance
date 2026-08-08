// src/app/(auth)/layout.tsx

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative pixel grid bg */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--abyssal) 1px, transparent 1px),
            linear-gradient(90deg, var(--abyssal) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-abyssal opacity-40" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-abyssal opacity-40" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-abyssal opacity-40" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-abyssal opacity-40" />

      {/* Width is controlled per-page — register stays a narrow single card,
          login widens into a two-column layout on desktop. */}
      <div className="w-full flex justify-center relative z-10">
        {children}
      </div>
    </div>
  );
}