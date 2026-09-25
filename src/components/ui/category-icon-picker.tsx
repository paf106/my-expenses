"use client";

import { Check, ChevronDown } from "lucide-react";
import { CategoryIcon, categoryIconOptions } from "@/components/ui/category-icon";
import { Popover } from "@/components/ui/popover";
import { cx } from "@/lib/utils";

export function CategoryIconPicker({ value, onChange, className, mobileSheet = true }: { value: string; onChange: (value: string) => void; className?: string; mobileSheet?: boolean }) {
  const selected = categoryIconOptions.find((icon) => icon.value === value) || categoryIconOptions[0];
  return <Popover label="Elegir icono de categoría" align="end" mobileSheet={mobileSheet} panelClassName="max-h-[min(56dvh,440px)] overflow-y-auto" trigger={({ onClick, expanded, controls, triggerRef }) => <button ref={triggerRef} type="button" aria-label={`Icono: ${selected.label}`} aria-haspopup="grid" aria-expanded={expanded} aria-controls={controls} onClick={onClick} className={cx("flex min-h-11 items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 text-[var(--ink)] hover:bg-[var(--soft-blue)]", className)}>
    <span className="flex min-w-0 items-center gap-2"><CategoryIcon name={value} size={18}/><span className="sr-only">{selected.label}</span></span><ChevronDown size={15} className="shrink-0 text-[var(--muted)]"/>
  </button>}>
    {(close) => <><div className="mb-3 px-1 text-sm font-semibold text-[var(--ink)]">Elige un icono</div><div role="grid" className="grid grid-cols-5 justify-items-center gap-1 sm:grid-cols-6">{categoryIconOptions.map((icon) => <button key={icon.value} data-popover-item type="button" aria-label={icon.label} aria-pressed={value === icon.value} onClick={() => { onChange(icon.value); close(); }} className={cx("relative flex h-12 w-12 items-center justify-center rounded-xl text-[var(--ink)] hover:bg-[var(--soft-blue)] focus-visible:bg-[var(--soft-blue)]", value === icon.value && "bg-[var(--soft-blue)] text-[#2866d7]")}><CategoryIcon name={icon.value} size={19}/>{value === icon.value && <Check size={11} className="absolute right-1 top-1 text-[var(--income)]"/>}</button>)}</div></>}
  </Popover>;
}
