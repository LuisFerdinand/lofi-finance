// components/ui/Modal.tsx
"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils";

// Open modals, innermost last — so Escape only closes the top one when a
// ConfirmDialog is stacked over an edit modal.
const stack: string[] = [];

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Header bar color classes (bg + text). */
  headerClassName?: string;
  /** Extra header content right of the title (before the close button). */
  headerExtra?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Stack above other modals (confirm dialogs). */
  elevated?: boolean;
  /** Close when the backdrop is clicked (default true). */
  dismissible?: boolean;
}

const SIZE = { sm: "md:max-w-sm", md: "md:max-w-md", lg: "md:max-w-2xl" };

// Shared dialog shell. Portaled to <body> so it escapes every page wrapper —
// the pages animate in with a CSS transform, and a transformed ancestor turns
// `position: fixed` into "fixed to that ancestor", which is why modals used to
// jump or sit under the mobile nav. Bottom sheet on phones, centered card on
// desktop; Escape and backdrop click close it.
export default function Modal({
  open,
  onClose,
  title,
  children,
  headerClassName = "bg-abyssal text-palladian",
  headerExtra,
  size = "md",
  elevated = false,
  dismissible = true,
}: ModalProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    stack.push(id);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && stack[stack.length - 1] === id) {
        e.stopPropagation();
        onCloseRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = stack.lastIndexOf(id);
      if (i !== -1) stack.splice(i, 1);
    };
  }, [open, id]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 bg-abyssal/70 flex items-end md:items-center justify-center md:p-4",
        elevated ? "z-[80]" : "z-[70]"
      )}
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "pixel-box bg-card w-full animate-slide-up max-h-[92dvh] overflow-y-auto overscroll-contain",
          SIZE[size]
        )}
      >
        <div
          className={cn(
            "px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-10",
            headerClassName
          )}
        >
          <div id={titleId} className="font-pixel text-xs min-w-0 truncate">
            {title}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {headerExtra}
            <button
              type="button"
              onClick={onClose}
              aria-label="close"
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
