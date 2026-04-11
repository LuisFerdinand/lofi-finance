// src/components/layout/LogoMark.tsx
"use client";

import { useState } from "react";

/**
 * Uses a plain <img> tag intentionally — Next.js image optimization
 * can fail silently in dev with certain PNG files. For a small logo
 * this is perfectly fine and avoids the optimization pipeline entirely.
 */
export default function LogoMark({ size = 24 }: { size?: number }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span
        className="font-pixel text-abyssal leading-none select-none"
        style={{ fontSize: size * 0.45 }}
      >
        LF
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="LoFi Finance"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", imageRendering: "pixelated" }}
      onError={() => setError(true)}
    />
  );
}