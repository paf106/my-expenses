"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import type { Category, Transaction } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { dateLabel, euro } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CategoryPicker } from "@/components/ui/category-picker";
import { Popover } from "@/components/ui/popover";

export function TransactionsView({ month, transactions, categories, initialType, initialCategory, initialSearch, onEdit }: { month: string; transactions: Transaction[]; categories: Category[]; initialType: string; initialCategory: string; initialSearch: string; onEdit: (transaction: Transaction) => void }) {
  const [filter, setFilter] = useState(initialType);
  const [query, setQuery] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState<Transaction | null>(null);
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const searchTimeout = useRef<number | null>(null);
  useEffect(() => () => { if (searchTimeout.current !== null) window.clearTimeout(searchTimeout.current); }, []);
  const rows = transactions;
  const cats = categories;
  const groups = useMemo(() => rows.reduce<Record<string, Transaction[]>>((acc, transaction) => { (acc[transaction.date] ||= []).push(transaction); return acc; }, {}), [rows]);
  const commitSearch = (value: string) => {
    if (searchTimeout.current !== null) window.clearTimeout(searchTimeout.current);
    const next = new URLSearchParams(params.toString());
    if (value) next.set("q", value); else next.delete("q");
    if (filter === "all") next.delete("type"); else next.set("type", filter);
    if (category === "all") next.delete("category"); else next.set("category", category);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const searchChange = (value: string) => {
    setQuery(value);
    if (searchTimeout.current !== null) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => commitSearch(value), 300);
  };
  const updateParams = (type: string, q: string, selectedCategory = category) => {
    const next = new URLSearchParams(params.toString());
    if (type === "all") next.delete("type"); else next.set("type", type);
    if (q) next.set("q", q); else next.delete("q");
    if (selectedCategory === "all") next.delete("category"); else next.set("category", selectedCategory);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const remove = (transaction: Transaction) => startTransition(async () => {
    const { error } = await createClient().from("transactions").delete().eq("id", transaction.id);
    if (!error) { setRemoved(transaction); router.refresh(); }
  });
  const undo = () => {
    if (!removed) return;
    startTransition(async () => { await createClient().from("transactions").insert({ user_id: removed.user_id, type: removed.type, amount: removed.amount, description: removed.description, date: removed.date, category_id: removed.category_id, recurring_id: removed.recurring_id }); setRemoved(null); router.refresh(); });
  };
  return <div>
    <div className="mb-5 space-y-3">
      <div className="transaction-segmented" role="group" aria-label="Filtrar movimientos por tipo">{[{ id: "all", label: "Todos" }, { id: "expense", label: "Gastos" }, { id: "income", label: "Ingresos" }].map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => { if (searchTimeout.current !== null) window.clearTimeout(searchTimeout.current); const selectedStillMatches = cats.some((entry) => entry.id === category && (item.id === "all" || entry.type === item.id)); const nextCategory = selectedStillMatches ? category : "all"; setFilter(item.id); setCategory(nextCategory); updateParams(item.id, query, nextCategory); }} className={filter === item.id ? "is-active" : ""}>{item.label}</button>)}</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(180px,1fr)_minmax(150px,220px)_auto]">
        <label className="col-span-2 flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 focus-within:border-[var(--focus)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--focus)_25%,transparent)] sm:col-span-1"><Search size={16} className="muted shrink-0"/><input aria-label="Buscar movimientos" value={query} onChange={(event) => searchChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") commitSearch(query); }} placeholder="Buscar movimiento" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]" /></label>
        <CategoryPicker categories={cats.filter((item) => filter === "all" || item.type === filter)} value={category} onChange={(value) => { if (searchTimeout.current !== null) window.clearTimeout(searchTimeout.current); setCategory(value); updateParams(filter, query, value); }} label="Filtrar por categoría" className="w-full" />
         <Popover label="Opciones de movimientos" align="end" trigger={({ onClick, expanded, controls, triggerRef }) => <button ref={triggerRef} type="button" aria-label="Más opciones" aria-haspopup="menu" aria-expanded={expanded} aria-controls={controls} onClick={onClick} className="icon-button border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--soft-blue)]"><MoreHorizontal size={20}/></button>}>
          {(close) => <a data-popover-item role="menuitem" href={`/transactions/export?month=${month}${filter !== "all" ? `&type=${filter}` : ""}${category !== "all" ? `&category=${category}` : ""}`} onClick={close} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]"><Download size={16}/>Descargar CSV</a>}
        </Popover>
      </div>
    </div>
    {!Object.keys(groups).length ? <div className="card flex min-h-60 flex-col items-center justify-center p-6 text-center"><span className="mb-3 rounded-2xl bg-[var(--soft-blue)] p-3"><Search size={21}/></span><h2 className="m-0 text-base font-semibold">Todavía no hay movimientos</h2><p className="muted mb-0 mt-2 max-w-xs text-sm">Cuando apuntes un gasto o ingreso, aparecerá aquí ordenado por fecha.</p></div> : <div className="space-y-4">{Object.entries(groups).map(([day, list]) => { const dailyTotal = list.reduce((sum, row) => sum + (row.type === "income" ? row.amount : -row.amount), 0); return <section key={day} className="card overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 text-sm font-semibold"><span>{dateLabel(day)}</span><span className={`amount text-xs ${dailyTotal > 0 ? "text-[var(--income)]" : "muted"}`}>{dailyTotal > 0 ? "+" : dailyTotal < 0 ? "−" : ""}{euro(Math.abs(dailyTotal))}</span></div><ul className="m-0 list-none p-0">{list.map((transaction) => { const category = cats.find((item) => item.id === transaction.category_id); const income = transaction.type === "income"; const transactionName = transaction.description || category?.name || "movimiento"; return <li key={transaction.id} className="group flex items-center gap-3 border-b border-[var(--line)] px-4 py-3 last:border-0 sm:gap-4 sm:px-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: category?.color || "var(--muted)", background: category?.color ? `color-mix(in srgb, ${category.color} 14%, transparent)` : "var(--soft-blue)" }}><CategoryIcon name={category?.icon} size={18}/></span><div className="min-w-0 flex-1"><p className="m-0 truncate text-sm font-medium">{transaction.description || category?.name || "Movimiento"}</p><p className="muted m-0 mt-1 truncate text-xs">{category?.name || "Sin categoría"}</p></div><strong className={`amount whitespace-nowrap text-xs sm:text-sm ${income ? "text-[var(--income)]" : ""}`}>{income ? "+" : "−"}{euro(transaction.amount)}</strong><Popover label={`Opciones de ${transactionName}`} align="end" trigger={({ onClick, expanded, controls, triggerRef }) => <button ref={triggerRef} type="button" aria-label={`Opciones de ${transactionName}`} aria-haspopup="menu" aria-expanded={expanded} aria-controls={controls} onClick={onClick} className="icon-button !min-h-11 !min-w-11 shrink-0 text-[var(--muted)] hover:bg-[var(--soft-blue)] hover:text-[var(--ink)]"><MoreHorizontal size={20}/></button>}>
              {(close) => <><button data-popover-item role="menuitem" type="button" onClick={() => { close(); onEdit(transaction); }} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-[var(--ink)] hover:bg-[var(--soft-blue)]"><Pencil size={16}/>Editar</button><button data-popover-item role="menuitem" type="button" disabled={pending} onClick={() => { close(); remove(transaction); }} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-[var(--expense)] hover:bg-[var(--danger-soft)] disabled:opacity-50"><Trash2 size={16}/>Eliminar</button></>}
            </Popover></li>; })}</ul></section>; })}</div>}
    {removed && <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+156px)] left-1/2 z-40 flex max-w-[calc(100vw-112px)] -translate-x-1/2 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-2 text-xs text-[var(--primary-ink)] shadow-xl sm:gap-4 sm:px-4 sm:py-3 sm:text-sm md:bottom-8 md:max-w-none" role="status"><span className="whitespace-nowrap">Movimiento eliminado</span><button onClick={undo} className="min-h-10 whitespace-nowrap font-semibold underline underline-offset-2">Deshacer</button><button onClick={() => setRemoved(null)} aria-label="Cerrar aviso" className="icon-button !min-h-9 !min-w-9"><span aria-hidden>×</span></button></div>}
  </div>;
}
