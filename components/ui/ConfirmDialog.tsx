// components/ui/ConfirmDialog.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

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
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      elevated
      headerClassName="bg-truffle text-palladian"
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle size={14} /> {title}
        </span>
      }
    >
      <div className="p-4">
        <p className="font-mono text-sm">{message}</p>
      </div>

      <div className="p-4 pt-0 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          autoFocus
          className="flex-1 pixel-btn bg-truffle text-palladian font-pixel py-3 disabled:opacity-60 transition-colors"
          style={{ fontSize: "11px" }}
        >
          {loading ? "WORKING..." : `► ${confirmLabel}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="pixel-btn bg-muted text-foreground font-pixel px-4 py-3 transition-colors"
          style={{ fontSize: "11px" }}
        >
          CANCEL
        </button>
      </div>
    </Modal>
  );
}
