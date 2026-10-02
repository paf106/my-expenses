"use client";

import { useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatDateEs, parseDateEs } from "@/lib/utils";
import { cx } from "@/lib/utils";

export function DateField({ id, value, onChange, required, className }: { id?: string; value: string; onChange: (value: string) => void; required?: boolean; className?: string }) {
  const picker = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => formatDateEs(value));
  const formatted = formatDateEs(value);

  const edit = (input: string) => {
    const digits = input.replace(/\D/g, "").slice(0, 8);
    const next = digits.length > 4 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    setDraft(next);
    const parsed = parseDateEs(next);
    textInput.current?.setCustomValidity(digits.length === 8 && !parsed ? "Escribe una fecha real con formato DD/MM/AAAA." : "");
    if (parsed) onChange(parsed);
  };
  const commit = () => {
    if (draft && !parseDateEs(draft)) textInput.current?.reportValidity();
    else setDraft(formatted);
  };
  const openPicker = () => {
    const input = picker.current;
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
  };

  return <div className={cx("relative", className)}>
    <input ref={textInput} id={id} type="text" inputMode="numeric" autoComplete="off" required={required} pattern="\d{2}/\d{2}/\d{4}" aria-label="Fecha (DD/MM/AAAA)" placeholder="DD/MM/AAAA" value={draft} onChange={(event) => edit(event.target.value)} onBlur={commit} className="control pr-12" />
    <button type="button" aria-label="Abrir calendario" onClick={openPicker} className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--soft-blue)]"><CalendarDays size={17}/></button>
    <input ref={picker} tabIndex={-1} aria-hidden="true" type="date" value={value} onChange={(event) => { onChange(event.target.value); setDraft(formatDateEs(event.target.value)); }} className="pointer-events-none absolute bottom-0 right-1 h-px w-px opacity-0" />
  </div>;
}
