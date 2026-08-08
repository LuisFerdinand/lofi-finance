// components/ui/Tooltip.tsx
"use client";

import { useRef, useState, type ReactNode } from "react";

interface Pos {
  top: number;
  left: number;
}

// Pixel-themed hover tooltip. Positioned with `fixed` + coordinates computed
// from the trigger's bounding rect on hover (via JS state), NOT `absolute` +
// CSS group-hover — an `absolute` tooltip gets clipped by any scrollable
// ancestor (e.g. the sidebar nav's `overflow-y-auto`), since the browser
// computes overflow-x as clipped too once overflow-y is non-visible. `fixed`
// positioning escapes that clip because it isn't contained by a plain
// overflow:auto ancestor (only transform/filter/perspective ancestors trap it,
// and the sidebar has none).
export default function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [pos, setPos] = useState<Pos | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  function show() {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  }

  function hide() {
    setPos(null);
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {pos && (
        <span
          className="fixed z-[100] -translate-y-1/2 whitespace-nowrap px-2 py-1.5
                     bg-abyssal text-palladian font-pixel pixel-box-sm pointer-events-none"
          style={{ top: pos.top, left: pos.left, fontSize: "8px" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
