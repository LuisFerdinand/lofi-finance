// components/projects/CloudinaryImageInput.tsx
"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  /** false = Cloudinary env vars missing on the server (show a setup hint);
   *  null = still probing (render the dropzone optimistically). */
  enabled: boolean | null;
}

// Click-to-pick / drag-drop image upload to Cloudinary (signed — the server
// hands out a signature per upload). The parent modal also wires a window-level
// paste listener that calls uploadToCloudinary directly, so "paste a screenshot"
// works anywhere in the modal.
export default function CloudinaryImageInput({ value, onChange, enabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="pixel-inset bg-background p-2 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="task attachment"
          className="w-full max-h-56 object-contain border-2 border-abyssal"
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="remove image"
          className="absolute top-3 right-3 pixel-btn bg-truffle text-palladian p-1.5"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  if (enabled === false) {
    return (
      <div className="pixel-inset bg-background p-3 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          image upload needs Cloudinary — add
          <br />
          <span className="text-foreground">CLOUDINARY_CLOUD_NAME</span>,{" "}
          <span className="text-foreground">CLOUDINARY_API_KEY</span>,{" "}
          <span className="text-foreground">CLOUDINARY_API_SECRET</span>
          <br />
          to .env.local
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={`pixel-inset bg-background p-4 text-center transition-colors ${
        dragOver ? "bg-muted" : ""
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="pixel-btn bg-muted font-pixel px-3 py-2 inline-flex items-center gap-2 disabled:opacity-60"
        style={{ fontSize: "8px" }}
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
        {uploading ? "UPLOADING..." : "UPLOAD IMAGE"}
      </button>
      <p className="font-mono text-xs text-muted-foreground mt-2">
        click, drop, or paste a screenshot
      </p>
    </div>
  );
}
