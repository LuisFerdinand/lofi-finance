// components/ui/Amount.tsx
import { cn } from "@/utils";

interface AmountProps {
  /** Already-formatted text, e.g. "Rp 12.500.000" or "−Rp 300.000". */
  children: string;
  /** Largest font size (px) — what the figure gets when there's plenty of room. */
  max?: number;
  /** Smallest font size (px) before it would stop being readable. */
  min?: number;
  className?: string;
}

// A money figure that always fits on one line in whatever box it's put in.
//
// The pixel font is exactly 1em per glyph and the mono font about 0.62em, so the
// font-size that fills the box is simply (box width ÷ glyph count ÷ glyph width).
// A container query gives us the box width (cqw), so no JS measuring and no
// mid-number `break-all` wrapping. Phones use the narrower mono face (bold, so
// it stays legible at small sizes); from `sm` up it's the pixel font again.
export default function Amount({ children, max = 16, min = 9, className }: AmountProps) {
  // +0.5 glyph of slack so a figure never touches the box edge.
  const glyphs = children.length + 0.5;
  return (
    <span className="block w-full min-w-0" style={{ containerType: "inline-size" }}>
      <span
        className={cn(
          "block whitespace-nowrap leading-tight tabular-nums",
          "font-mono font-bold [--glyph:0.62] sm:font-pixel sm:font-normal sm:[--glyph:1]",
          className
        )}
        style={{
          fontSize: `clamp(${min}px, calc(100cqw / (${glyphs} * var(--glyph))), ${max}px)`,
        }}
      >
        {children}
      </span>
    </span>
  );
}
