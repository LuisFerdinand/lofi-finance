// components/ui/FabButton.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

// Mobile-only floating "add" button, positioned above MobileNav. Portaled to
// document.body rather than rendered in place — every page root wraps its
// content in `.animate-slide-up`, and a CSS transform on ANY ancestor (even
// mid-animation, even after a completed keyframe animation) becomes the
// containing block for `position:fixed` descendants, which silently breaks
// bottom/right offsets. Portaling escapes that regardless of what page it's
// used on. `mounted` gates the portal to avoid an SSR/hydration mismatch —
// document doesn't exist on the server, so this renders nothing there and on
// the client's first render, then flips on right after mount.
export default function FabButton({ icon: Icon, label, onClick }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Mount-detection for portal-safe rendering — document doesn't exist
    // during SSR, so this flips on client-side only, after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return createPortal(
    <button
      onClick={onClick}
      aria-label={label}
      className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 pixel-btn bg-burning-flame text-abyssal flex items-center justify-center"
    >
      <Icon size={22} />
    </button>,
    document.body
  );
}
