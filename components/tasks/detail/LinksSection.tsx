// components/tasks/detail/LinksSection.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, Link2, Pencil, Plus, Trash2, X } from "lucide-react";
import { hostLabel, newId, normalizeUrl, type TodoLink } from "@/utils/projects-helpers";
import { Section } from "./Section";

const MAX_LINKS = 20;

export default function LinksSection({
  links,
  onChange,
}: {
  links: TodoLink[];
  onChange: (links: TodoLink[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) {
      toast.error("that doesn't look like a web link (http/https)");
      return;
    }
    if (links.length >= MAX_LINKS) {
      toast.error(`up to ${MAX_LINKS} links per task`);
      return;
    }
    onChange([...links, { id: newId(), label: label.trim().slice(0, 80) || hostLabel(normalized), url: normalized }]);
    setLabel("");
    setUrl("");
  }

  return (
    <Section icon={Link2} title="LINKS" aside={links.length > 0 ? `${links.length}/${MAX_LINKS}` : undefined}>
      {links.length === 0 && (
        <p className="font-mono text-sm text-muted-foreground mb-3">
          attach designs, docs, PRs, tickets — anything you&apos;ll need while working on this
        </p>
      )}

      {links.length > 0 && (
        <ul className="border-2 border-border divide-y divide-border mb-3">
          {links.map((link) =>
            editingId === link.id ? (
              <LinkEditor
                key={link.id}
                link={link}
                onCancel={() => setEditingId(null)}
                onSave={(next) => {
                  onChange(links.map((l) => (l.id === link.id ? next : l)));
                  setEditingId(null);
                }}
              />
            ) : (
              <li key={link.id} className="flex items-center gap-3 px-3 py-2.5 bg-background group">
                <span className="shrink-0 w-8 h-8 border-2 border-abyssal bg-muted flex items-center justify-center">
                  <Link2 size={15} />
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 hover:underline"
                  title={link.url}
                >
                  <span className="block font-mono text-sm font-bold truncate">{link.label || hostLabel(link.url)}</span>
                  <span className="block font-mono text-xs text-muted-foreground truncate">{hostLabel(link.url)}</span>
                </a>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`open ${link.label}`}
                  className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => setEditingId(link.id)}
                  aria-label={`edit ${link.label}`}
                  className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(links.filter((l) => l.id !== link.id))}
                  aria-label={`remove ${link.label}`}
                  className="shrink-0 p-1.5 text-muted-foreground hover:text-truffle transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            )
          )}
        </ul>
      )}

      {links.length < MAX_LINKS && (
        <form onSubmit={add} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            placeholder="label (e.g. Figma mockup)"
            aria-label="link label"
            className="min-w-0 pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
            placeholder="https://…"
            aria-label="link URL"
            className="min-w-0 pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!url.trim()}
            className="pixel-btn bg-burning-flame text-abyssal font-pixel px-4 py-2 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            style={{ fontSize: "10px" }}
          >
            <Plus size={14} strokeWidth={3} /> ADD LINK
          </button>
        </form>
      )}
    </Section>
  );
}

function LinkEditor({
  link,
  onSave,
  onCancel,
}: {
  link: TodoLink;
  onSave: (link: TodoLink) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(link.label);
  const [url, setUrl] = useState(link.url);

  return (
    <li className="p-3 bg-muted/40">
      <form
        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const normalized = normalizeUrl(url);
          if (!normalized) {
            toast.error("that doesn't look like a web link (http/https)");
            return;
          }
          onSave({ ...link, label: label.trim().slice(0, 80) || hostLabel(normalized), url: normalized });
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      >
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={80}
          aria-label="link label"
          className="min-w-0 pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          inputMode="url"
          aria-label="link URL"
          className="min-w-0 pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none"
        />
        <div className="flex gap-2">
          <button type="submit" aria-label="save link" className="pixel-btn bg-status-done text-white px-3 py-2">
            <Check size={15} strokeWidth={3} />
          </button>
          <button type="button" onClick={onCancel} aria-label="cancel" className="pixel-btn bg-muted px-3 py-2">
            <X size={15} />
          </button>
        </div>
      </form>
    </li>
  );
}
