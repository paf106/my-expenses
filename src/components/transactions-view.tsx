"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Category, MonthTransaction } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { filterTransactions } from "@/lib/utils";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionDayGroup } from "@/components/transactions/transaction-day-group";
import { useTransactionDialog } from "@/components/transaction-dialog-context";

export function TransactionsView({ month, transactions, categories }: { month: string; transactions: MonthTransaction[]; categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState<MonthTransaction | null>(null);
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const filter = params.get("type") || "all";
  const query = params.get("q") || "";
  const category = params.get("category") || "all";
  const deferredQuery = useDeferredValue(query);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const { openEdit } = useTransactionDialog();
  const groups = useMemo(() => {
    const filtered = filterTransactions(transactions, categories, { type: filter, category, query: deferredQuery });
    return filtered.reduce<Record<string, MonthTransaction[]>>((acc, transaction) => { (acc[transaction.date] ||= []).push(transaction); return acc; }, {});
  }, [transactions, categories, filter, category, deferredQuery]);

  const syncParams = (type: string, q: string, selectedCategory: string) => {
    const next = new URLSearchParams(params.toString());
    if (q) next.set("q", q); else next.delete("q");
    if (type === "all") next.delete("type"); else next.set("type", type);
    if (selectedCategory === "all") next.delete("category"); else next.set("category", selectedCategory);
    const queryString = next.toString();
    window.history.replaceState(null, "", queryString ? `${pathname}?${queryString}` : pathname);
  };
  const handleFilter = (value: string) => {
    const selectedStillMatches = categories.some((entry) => entry.id === category && (value === "all" || entry.type === value));
    const nextCategory = selectedStillMatches ? category : "all";
    syncParams(value, query, nextCategory);
  };
  const handleQuery = (value: string) => syncParams(filter, value, category);
  const handleCategory = (value: string) => syncParams(filter, query, value);
  const remove = (transaction: MonthTransaction) => startTransition(async () => {
    const { error } = await createClient().from("transactions").delete().eq("id", transaction.id);
    if (!error) { setRemoved(transaction); router.refresh(); }
  });
  const undo = () => {
    if (!removed) return;
    startTransition(async () => {
      await createClient().from("transactions").insert({ type: removed.type, amount: removed.amount, description: removed.description, date: removed.date, category_id: removed.category_id, recurring_id: removed.recurring_id });
      setRemoved(null);
      router.refresh();
    });
  };

  return <div>
    <TransactionFilters month={month} filter={filter} query={query} category={category} categories={categories} onFilter={handleFilter} onQuery={handleQuery} onCategory={handleCategory}/>
    {!Object.keys(groups).length
      ? <div className="card flex min-h-60 flex-col items-center justify-center p-6 text-center"><span className="mb-3 rounded-2xl bg-[var(--soft-blue)] p-3"><Search size={21}/></span><h2 className="m-0 text-base font-semibold">{transactions.length ? "No hay movimientos con estos filtros" : "Todavía no hay movimientos"}</h2><p className="muted mb-0 mt-2 max-w-xs text-sm">{transactions.length ? "Prueba a cambiar la búsqueda o los filtros." : "Cuando apuntes un gasto o ingreso, aparecerá aquí ordenado por fecha."}</p></div>
      : <div className="space-y-4">{Object.entries(groups).map(([day, list]) => <TransactionDayGroup key={day} day={day} transactions={list} categories={categoryMap} pending={pending} onEdit={openEdit} onRemove={remove}/>)}</div>}
    {removed && <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+156px)] left-1/2 z-40 flex max-w-[calc(100vw-112px)] -translate-x-1/2 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-2 text-xs text-[var(--primary-ink)] shadow-xl sm:gap-4 sm:px-4 sm:py-3 sm:text-sm md:bottom-8 md:max-w-none" role="status"><span className="whitespace-nowrap">Movimiento eliminado</span><button onClick={undo} className="min-h-10 whitespace-nowrap font-semibold underline underline-offset-2">Deshacer</button><button onClick={() => setRemoved(null)} aria-label="Cerrar aviso" className="icon-button !min-h-9 !min-w-9"><span aria-hidden>×</span></button></div>}
  </div>;
}
