// src/components/ui/RupiahInput.tsx
"use client";

import { useState, useId } from "react";
import { formatRupiahInput, parseRupiahInput } from "@/utils";

interface RupiahInputProps {
  /** Controlled raw integer value (what gets stored / sent to API) */
  value: number;
  onChange: (raw: number) => void;
  required?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  label?: string;
}

/**
 * A pixel-styled Rupiah amount input.
 * - Displays a dot-separated thousands preview below the field as you type
 * - Accepts only digits; ignores everything else
 * - Emits the raw integer to onChange (no division / multiplication needed)
 */
export default function RupiahInput({
  value,
  onChange,
  required,
  autoFocus,
  placeholder = "e.g. 50000",
  label = "AMOUNT (Rp)",
}: RupiahInputProps) {
  const id = useId();
  // Keep a local display string so partial typing (e.g. "5000") stays editable
  const [display, setDisplay] = useState<string>(value > 0 ? String(value) : "");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip everything except digits
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

      <div className="relative">
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
                     placeholder:text-muted-foreground pr-3"
        />
      </div>

      {/* Live formatted preview */}
      <div className={`mt-1 flex items-center gap-2 transition-opacity ${showPreview ? "opacity-100" : "opacity-0"}`}>
        <span className="font-pixel text-muted-foreground" style={{ fontSize: "7px" }}>
          =
        </span>
        <span className="font-pixel text-burning-flame tracking-wide" style={{ fontSize: "9px" }}>
          Rp {formatted}
        </span>
      </div>
    </div>
  );
}