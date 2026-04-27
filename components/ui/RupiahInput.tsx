// components/ui/RupiahInput.tsx
"use client";

import { useId, useEffect, useState } from "react";
import { formatRupiahInput } from "@/utils";

interface RupiahInputProps {
  value: number;
  onChange: (raw: number) => void;
  required?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  label?: string;
}

export default function RupiahInput({
  value,
  onChange,
  required,
  autoFocus,
  placeholder = "e.g. 50000",
  label = "AMOUNT (Rp)",
}: RupiahInputProps) {
  const id = useId();

  // Keep display string in sync with external value changes (e.g. quick fill)
  const [display, setDisplay] = useState<string>(value > 0 ? String(value) : "");

  useEffect(() => {
    // When parent sets value externally (quick fill), update display string
    const expected = value > 0 ? String(value) : "";
    const current = display.replace(/\D/g, "");
    if (current !== expected) {
      setDisplay(expected);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setDisplay(digits);
    onChange(parseInt(digits || "0", 10));
  }

  const formatted = formatRupiahInput(display);
  const showPreview = display.length > 0;

  return (
    <div>
      <label htmlFor={id} className="font-pixel block mb-1" style={{ fontSize: "8px" }}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        required={required}
        autoFocus={autoFocus}
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pixel-inset bg-background px-3 py-2 font-mono text-sm
                   focus:outline-none focus:border-burning-flame
                   placeholder:text-muted-foreground"
      />
      <div className={`mt-1 flex items-center gap-2 transition-opacity ${showPreview ? "opacity-100" : "opacity-0"}`}>
        <span className="font-pixel text-muted-foreground" style={{ fontSize: "7px" }}>=</span>
        <span className="font-pixel text-burning-flame tracking-wide" style={{ fontSize: "9px" }}>
          Rp {formatted}
        </span>
      </div>
    </div>
  );
}