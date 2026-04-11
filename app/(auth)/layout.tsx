// src/app/(auth)/layout.tsx
import LogoMark from "@/components/layout/LogoMark";

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

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center pixel-box bg-burning-flame mb-3"
            style={{ width: 64, height: 64 }}
          >
            <LogoMark size={40} />
          </div>
          <h1 className="font-pixel text-abyssal text-sm leading-loose">
            LoFi<br />Finance
          </h1>
          <p className="text-muted-foreground text-xs mt-2 font-mono">
            your cozy money tracker
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}