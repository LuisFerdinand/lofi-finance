// components/ui/Tooltip.tsx
"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Pos {
  top: number;
  left: number;
}

interface TooltipProps {
  label: string;
  children: ReactNode;
  /** "right" (default) for the collapsed sidebar; "bottom" for header controls. */
  position?: "right" | "bottom";
}

// Pixel-themed hover tooltip. Positioned with `fixed` + coordinates computed
// from the trigger's bounding rect on hover, and rendered via a portal into
// document.body — NOT as a child of the trigger. A `fixed` element only
// escapes clipping/stacking from ancestors that are plain `overflow:auto`,
// but any ancestor with `position: sticky`/`fixed`, a transform, or a filter
// creates its own stacking context that traps `fixed` descendants inside it,
// capping them below whatever comes after that ancestor in paint order (e.g.
// the sidebar is `sticky`, so a tooltip left as its child rendered behind
// later page content no matter how high its z-index went). Portaling to
// <body> sidesteps that entirely.
export default function Tooltip({ label, children, position = "right" }: TooltipProps) {
  const [pos, setPos] = useState<Pos | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  function show() {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (position === "bottom") {
      setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    } else {
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
    }
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
      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            className={`fixed z-[100] whitespace-nowrap px-2 py-1.5
                       bg-abyssal text-palladian font-pixel pixel-box-sm pointer-events-none
                       ${position === "bottom" ? "-translate-x-1/2" : "-translate-y-1/2"}`}
            style={{ top: pos.top, left: pos.left, fontSize: "8px" }}
          >
            {label}
          </span>,
          document.body
        )}
    </div>
  );
}
