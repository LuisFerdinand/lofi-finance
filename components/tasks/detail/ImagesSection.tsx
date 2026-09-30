// components/tasks/detail/ImagesSection.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, ImagePlus, Images, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/utils";
import { checkCloudinaryConfigured, uploadToCloudinary } from "@/utils/cloudinary";
import { newId, type TodoImage } from "@/utils/projects-helpers";
import Modal from "@/components/ui/Modal";
import { Section } from "./Section";

export const MAX_IMAGES = 12;

// Multi-image attachments. Files upload in parallel straight to Cloudinary
// (signed per upload — see utils/cloudinary.ts); each finished upload is added
// through `onAdd`, which the page persists. Paste works anywhere on the page.
export default function ImagesSection({
  images,
  onAdd,
  onRemove,
}: {
  images: TodoImage[];
  onAdd: (images: TodoImage[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState<{ id: string; name: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<TodoImage | null>(null);
  const slotsLeft = MAX_IMAGES - images.length - uploading.length;
  const slotsRef = useRef(slotsLeft);
  useEffect(() => {
    slotsRef.current = slotsLeft;
  }, [slotsLeft]);

  useEffect(() => {
    let active = true;
    checkCloudinaryConfigured().then((ok) => {
      if (active) setEnabled(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  const uploadRef = useRef<(files: File[]) => void>(() => {});
  useEffect(() => {
    uploadRef.current = (files: File[]) => {
      const imagesOnly = files.filter((f) => f.type.startsWith("image/"));
      if (imagesOnly.length === 0) {
        if (files.length > 0) toast.error("only image files can be attached");
        return;
      }
      const room = Math.max(0, slotsRef.current);
      if (room === 0) {
        toast.error(`up to ${MAX_IMAGES} images per task`);
        return;
      }
      const batch = imagesOnly.slice(0, room);
      if (batch.length < imagesOnly.length) toast.info(`only ${room} more image${room === 1 ? "" : "s"} fit on this task`);
      slotsRef.current -= batch.length;

      const jobs = batch.map((file) => ({ id: newId(), file }));
      setUploading((list) => [...list, ...jobs.map((j) => ({ id: j.id, name: j.file.name || "pasted image" }))]);
      for (const job of jobs) {
        uploadToCloudinary(job.file)
          .then((url) => onAdd([{ id: job.id, url, name: (job.file.name || "screenshot").slice(0, 120) }]))
          .catch((err) => toast.error(err instanceof Error ? err.message : "upload failed"))
          .finally(() => setUploading((list) => list.filter((u) => u.id !== job.id)));
      }
    };
  }, [onAdd]);

  // Paste a screenshot anywhere on the page.
  useEffect(() => {
    if (!enabled) return;
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter((i) => i.kind === "file" && i.type.startsWith("image/"))
        .map((i) => i.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length === 0) return;
      e.preventDefault();
      uploadRef.current(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [enabled]);

  const total = images.length + uploading.length;

  return (
    <Section icon={Images} title="IMAGES" aside={total > 0 ? `${images.length}/${MAX_IMAGES}` : undefined}>
      {enabled === false ? (
        <div className="pixel-inset bg-background p-4 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            image upload needs Cloudinary — add <span className="text-foreground">CLOUDINARY_CLOUD_NAME</span>,{" "}
            <span className="text-foreground">CLOUDINARY_API_KEY</span> and{" "}
            <span className="text-foreground">CLOUDINARY_API_SECRET</span> to .env.local
          </p>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            if (!Array.from(e.dataTransfer.types).includes("Files")) return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            uploadRef.current(Array.from(e.dataTransfer.files ?? []));
          }}
          className={cn("transition-colors", dragOver && "ring-2 ring-burning-flame ring-offset-2 ring-offset-card")}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative group aspect-square border-2 border-abyssal bg-muted overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPreview(img)}
                  aria-label={`preview ${img.name ?? "image"}`}
                  className="absolute inset-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name ?? "task attachment"}
                    loading="lazy"
                    className="img-smooth w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(img.id)}
                  aria-label={`remove ${img.name ?? "image"}`}
                  className="absolute top-1.5 right-1.5 pixel-btn bg-truffle text-palladian p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <X size={13} />
                </button>
              </div>
            ))}

            {uploading.map((u) => (
              <div
                key={u.id}
                className="aspect-square border-2 border-dashed border-border bg-background flex flex-col items-center justify-center gap-2 p-2"
              >
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground truncate max-w-full">{u.name}</span>
              </div>
            ))}

            {slotsLeft > 0 && (
              <button
                type="button"
                disabled={enabled === null}
                onClick={() => inputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-border bg-background hover:border-abyssal hover:bg-muted flex flex-col items-center justify-center gap-2 p-2 transition-colors disabled:opacity-50"
              >
                <ImagePlus size={22} className="text-muted-foreground" />
                <span className="font-pixel text-center" style={{ fontSize: "9px" }}>
                  ADD IMAGES
                </span>
              </button>
            )}
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2">
            pick several at once, drop files here, or paste a screenshot anywhere on this page
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              uploadRef.current(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      )}

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        size="lg"
        title={preview?.name ?? "IMAGE"}
        headerExtra={
          preview ? (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs hover:underline"
            >
              open <ExternalLink size={12} />
            </a>
          ) : null
        }
      >
        {preview && (
          <div className="p-3 space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.url}
              alt={preview.name ?? "task attachment"}
              className="img-smooth w-full max-h-[70dvh] object-contain bg-muted border-2 border-abyssal"
            />
            <button
              type="button"
              onClick={() => {
                onRemove(preview.id);
                setPreview(null);
              }}
              className="pixel-btn bg-muted text-truffle hover:bg-truffle hover:text-palladian font-pixel px-3 py-2 inline-flex items-center gap-1.5 transition-colors"
              style={{ fontSize: "10px" }}
            >
              <Trash2 size={13} /> REMOVE IMAGE
            </button>
          </div>
        )}
      </Modal>
    </Section>
  );
}
