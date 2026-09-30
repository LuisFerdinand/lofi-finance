// components/tasks/detail/Section.tsx
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** A titled card on the task detail page. */
export function Section({
  icon: Icon,
  title,
  aside,
  children,
}: {
  icon: LucideIcon;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="pixel-box bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-pixel flex items-center gap-2" style={{ fontSize: "11px" }}>
          <Icon size={15} /> {title}
        </h2>
        {aside && <span className="font-mono text-xs text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
