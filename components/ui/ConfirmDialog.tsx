// components/ui/ConfirmDialog.tsx
"use client";

import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "DELETE",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-abyssal/70 z-[60] flex items-end md:items-center justify-center p-4 bottom-12 md:bottom-0"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="pixel-box bg-card w-full max-w-sm animate-slide-up">
        <div className="bg-truffle text-palladian px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            <span className="font-pixel text-xs">{title}</span>
          </div>
          <button onClick={onCancel} aria-label="cancel" className="text-palladian/70 hover:text-palladian transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-4">
          <p className="font-mono text-sm">{message}</p>
        </div>

        <div className="p-4 pt-0 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 pixel-btn bg-truffle text-palladian font-pixel py-3 disabled:opacity-60 transition-colors"
            style={{ fontSize: "9px" }}
          >
            {loading ? "DELETING..." : `► ${confirmLabel}`}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="pixel-btn bg-muted text-foreground font-pixel px-4 py-3 transition-colors"
            style={{ fontSize: "9px" }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
