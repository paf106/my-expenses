"use client";

import Link from "next/link";
import { Download, Search, X } from "lucide-react";
import type { Category } from "@/lib/supabase/types";
import { CategoryPicker } from "@/components/ui/category-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { euro } from "@/lib/utils";

const typeOptions = [{ id: "all", label: "Todos" }, { id: "expense", label: "Gastos" }, { id: "income", label: "Ingresos" }];

export function TransactionFilters({ month, filter, query, category, categories, resultCount, netTotal, hasActiveFilters, onFilter, onQuery, onCategory, onClear }: {
  month: string;
  filter: string;
  query: string;
  category: string;
  categories: Category[];
  resultCount: number;
  netTotal: number;
  hasActiveFilters: boolean;
  onFilter: (value: string) => void;
  onQuery: (value: string) => void;
  onCategory: (value: string) => void;
  onClear: () => void;
}) {
  const exportParams = new URLSearchParams({ month });
  if (filter !== "all") exportParams.set("type", filter);
  if (category !== "all") exportParams.set("category", category);
  if (query.trim()) exportParams.set("q", query.trim());
  const exportHref = `/transactions/export?${exportParams.toString()}`;
  const selectableCategories = categories.filter((item) => (filter === "all" || item.type === filter) && (!item.archived || item.id === category));

  return <div className="mb-5 space-y-3">
    <div className="hidden sm:block"><SegmentedControl options={typeOptions} value={filter} onChange={onFilter} label="Filtrar movimientos por tipo"/></div>
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--control-line)] bg-[var(--surface)] px-3 focus-within:border-[var(--focus)] focus-within:ring-2 focus-within:ring-[var(--focus)]">
        <Search size={16} aria-hidden="true" className="muted shrink-0"/>
        <input type="search" enterKeyHint="search" aria-label="Buscar movimientos" name="q" autoComplete="off" value={query} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} onChange={(event) => onQuery(event.target.value)} placeholder="Buscar movimiento" className="transaction-search-input min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--muted)] sm:text-sm" />
        {query && <button type="button" aria-label="Borrar búsqueda" onClick={() => onQuery("")} className="muted flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-[var(--soft-blue)]"><X size={16}/></button>}
      </label>
      <div className="hidden min-w-[180px] sm:block"><CategoryPicker categories={selectableCategories} value={category} onChange={onCategory} label="Filtrar por categoría" className="w-full" /></div>
      <Link href={exportHref} aria-label="Descargar CSV" title="Descargar CSV" className="icon-button shrink-0 border border-[var(--control-line)] bg-[var(--surface)] text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]"><Download aria-hidden="true" size={19}/></Link>
    </div>
    <div className="grid min-w-0 gap-2 sm:hidden">
      <SegmentedControl options={typeOptions} value={filter} onChange={onFilter} label="Filtrar movimientos por tipo" className="w-full justify-center" />
      <CategoryPicker categories={selectableCategories} value={category} onChange={onCategory} label="Filtrar por categoría" className="w-full" />
    </div>
    <div className="flex min-h-11 items-center justify-between gap-3 border-t border-[var(--line)] pt-2">
      <p className="muted m-0 text-xs" aria-live="polite">{resultCount} {resultCount === 1 ? "movimiento" : "movimientos"} · saldo {euro(netTotal)}</p>
      {hasActiveFilters && <button type="button" onClick={onClear} className="min-h-11 shrink-0 rounded-xl px-3 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--soft-blue)]">Limpiar filtros</button>}
    </div>
  </div>;
}
