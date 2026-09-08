// components/layout/AuthBrandHeader.tsx
import LogoMark from "./LogoMark";

export default function AuthBrandHeader() {
  return (
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
        your cozy money &amp; work tracker
      </p>
    </div>
  );
}
