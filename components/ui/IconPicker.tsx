// components/ui/IconPicker.tsx
"use client";

import type { LucideIcon } from "lucide-react";

interface IconPickerProps<T extends string> {
  icons: Record<T, LucideIcon>;
  value: T;
  onChange: (icon: T) => void;
}

export default function IconPicker<T extends string>({ icons, value, onChange }: IconPickerProps<T>) {
  const keys = Object.keys(icons) as T[];

  return (
    <div className="grid grid-cols-6 gap-2">
      {keys.map((key) => {
        const Icon: LucideIcon = icons[key];
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={key}
            className={`pixel-btn p-2 flex items-center justify-center transition-colors ${
              selected
                ? "bg-burning-flame text-abyssal border-abyssal"
                : "bg-muted text-foreground hover:bg-oatmeal"
            }`}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}
