"use client";

import { Download, MoreHorizontal, Search, X } from "lucide-react";
import type { Category } from "@/lib/supabase/types";
import { CategoryPicker } from "@/components/ui/category-picker";
import { Popover } from "@/components/ui/popover";

export function TransactionFilters({ month, filter, query, category, categories, onFilter, onQuery, onCategory }: { month: string; filter: string; query: string; category: string; categories: Category[]; onFilter: (value: string) => void; onQuery: (value: string) => void; onCategory: (value: string) => void }) {
  const typeOptions = [{ id: "all", label: "Todos" }, { id: "expense", label: "Gastos" }, { id: "income", label: "Ingresos" }];
  return <div className="mb-5 space-y-3">
    <div className="hidden sm:block"><TypeFilters options={typeOptions} filter={filter} onFilter={onFilter}/></div>
    <div className="flex gap-2 sm:grid sm:grid-cols-[minmax(180px,1fr)_minmax(150px,220px)_auto]">
      <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 focus-within:border-[var(--focus)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--focus)_25%,transparent)]"><Search size={16} className="muted shrink-0"/><input aria-label="Buscar movimientos" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Buscar movimiento" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]" />{query && <button type="button" aria-label="Borrar búsqueda" onClick={() => onQuery("")} className="muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-[var(--soft-blue)]"><X size={16}/></button>}</label>
      <Popover label="Opciones de movimientos" align="end" trigger={({ onClick, expanded, controls, triggerRef }) => <button ref={triggerRef} type="button" aria-label="Más opciones" aria-haspopup="menu" aria-expanded={expanded} aria-controls={controls} onClick={onClick} className="icon-button shrink-0 border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--soft-blue)] sm:col-start-3 sm:row-start-1"><MoreHorizontal size={20}/></button>}>
        {(close) => <a data-popover-item role="menuitem" href={`/transactions/export?month=${month}${filter !== "all" ? `&type=${filter}` : ""}${category !== "all" ? `&category=${category}` : ""}`} onClick={close} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]"><Download size={16}/>Descargar CSV</a>}
      </Popover>
      <div className="hidden sm:block sm:col-start-2 sm:row-start-1"><CategoryPicker categories={categories.filter((item) => filter === "all" || item.type === filter)} value={category} onChange={onCategory} label="Filtrar por categoría" className="w-full" /></div>
    </div>
    <div className="flex min-w-0 items-center gap-2 sm:hidden">
      <TypeFilters options={typeOptions} filter={filter} onFilter={onFilter} className="shrink-0" />
      <CategoryPicker categories={categories.filter((item) => filter === "all" || item.type === filter)} value={category} onChange={onCategory} label="Filtrar por categoría" className="min-w-0 flex-1" />
    </div>
  </div>;
}

function TypeFilters({ options, filter, onFilter, className = "" }: { options: { id: string; label: string }[]; filter: string; onFilter: (value: string) => void; className?: string }) {
  return <div className={`transaction-segmented ${className}`} role="group" aria-label="Filtrar movimientos por tipo">{options.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => onFilter(item.id)} className={filter === item.id ? "is-active" : ""}>{item.label}</button>)}</div>;
}
