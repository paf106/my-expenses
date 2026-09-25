"use client";

import { Check, ChevronDown } from "lucide-react";
import type { Category } from "@/lib/supabase/types";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Popover } from "@/components/ui/popover";
import { cx } from "@/lib/utils";

export function CategoryPicker({
  categories,
  value,
  onChange,
  allLabel = "Todas las categorías",
  label = "Categoría",
  className,
}: {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
  label?: string;
  className?: string;
}) {
  const selected = categories.find((category) => category.id === value);
  return <Popover label={label} align="end" panelClassName="max-h-[min(65dvh,420px)] w-[min(300px,calc(100vw-40px))] overflow-y-auto" trigger={({ onClick, expanded, controls, triggerRef }) => <button ref={triggerRef} type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={expanded} aria-controls={controls} onClick={onClick} className={cx("flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-left text-sm text-[var(--ink)] hover:bg-[var(--soft-blue)]", className)}>
    {selected ? <span className="flex min-w-0 flex-1 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ color: selected.color, backgroundColor: `color-mix(in srgb, ${selected.color} 15%, transparent)` }}><CategoryIcon name={selected.icon} size={16}/></span><span className="truncate">{selected.name}</span></span> : <span className="min-w-0 flex-1 truncate">{allLabel}</span>}
    <ChevronDown size={16} className="shrink-0 text-[var(--muted)]"/>
  </button>}>
    {(close) => <div role="listbox" aria-label={label} className="space-y-1">{
      [{ id: "all", name: allLabel, icon: null, color: "var(--muted)" }, ...categories.map((item) => ({ id: item.id, name: item.name, icon: item.icon, color: item.color }))].map((item) => <button key={item.id} data-popover-item type="button" role="option" aria-selected={value === item.id} onClick={() => { onChange(item.id === "all" ? "all" : item.id); close(); }} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-sm text-[var(--ink)] hover:bg-[var(--soft-blue)] focus-visible:bg-[var(--soft-blue)]">
        {item.icon ? <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ color: item.color, backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)` }}><CategoryIcon name={item.icon} size={17}/></span> : <span className="h-8 w-8 shrink-0"/>}
        <span className="min-w-0 flex-1 truncate">{item.name}</span>{value === item.id && <Check size={16} className="shrink-0 text-[var(--income)]"/>}
      </button>)
    }</div>}
  </Popover>;
}
