"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Category, MonthTransaction } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { euro, filterTransactions } from "@/lib/utils";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionDayGroup } from "@/components/transactions/transaction-day-group";
import { useTransactionDialog } from "@/components/transaction-dialog-context";
import { CategoryIcon } from "@/components/ui/category-icon";
import { UndoSnackbar } from "@/components/ui/undo-snackbar";
import { usePwa } from "@/components/pwa-provider";

export function TransactionsView({ month, transactions, categories }: { month: string; transactions: MonthTransaction[]; categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState<MonthTransaction | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [undoError, setUndoError] = useState("");
  const [actionError, setActionError] = useState("");
  const { online } = usePwa();
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const filter = params.get("type") || "all";
  const query = params.get("q") || "";
  const category = params.get("category") || "all";
  const deferredQuery = useDeferredValue(query);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const { openEdit } = useTransactionDialog();
  const visibleTransactions = useMemo(() => transactions.filter((item) => item.id !== removed?.id), [transactions, removed?.id]);
  const groups = useMemo(() => {
    const filtered = filterTransactions(visibleTransactions, categories, { type: filter, category, query: deferredQuery });
    return filtered.reduce<Record<string, MonthTransaction[]>>((acc, transaction) => { (acc[transaction.date] ||= []).push(transaction); return acc; }, {});
  }, [visibleTransactions, categories, filter, category, deferredQuery]);

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
    setActionError("");
    if (!online) { setActionError("Conéctate a internet para eliminar este movimiento."); return; }
    const { error } = await createClient().from("transactions").delete().eq("id", transaction.id);
    if (error) { setActionError("No se pudo eliminar el movimiento. Comprueba la conexión e inténtalo de nuevo."); return; }
    setRemoved(transaction); setUndoError(""); router.refresh();
  });
  const closeUndo = () => { setRemoved(null); setUndoError(""); window.requestAnimationFrame(() => document.getElementById("transactions-list-title")?.focus()); };
  const undo = () => {
    if (!removed || restoring) return;
    setRestoring(true);
    setUndoError("");
    startTransition(async () => {
      const { error } = await createClient().from("transactions").insert({ type: removed.type, amount: removed.amount, description: removed.description, date: removed.date, category_id: removed.category_id, recurring_id: removed.recurring_id });
      setRestoring(false);
      if (error) { setUndoError("No se pudo restaurar. Comprueba tu conexión e inténtalo de nuevo."); return; }
       setRemoved(null); setUndoError(""); router.refresh(); window.requestAnimationFrame(() => document.getElementById("transactions-list-title")?.focus());
    });
  };

  return <div className="motion-enter">
    <h2 id="transactions-list-title" tabIndex={-1} className="sr-only">Movimientos del periodo</h2>
    {actionError && <p role="alert" className="mb-4 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--expense)]">{actionError}</p>}
    <TransactionFilters month={month} filter={filter} query={query} category={category} categories={categories} onFilter={handleFilter} onQuery={handleQuery} onCategory={handleCategory}/>
    {!Object.keys(groups).length
       ? <div className="card flex min-h-60 flex-col items-center justify-center p-6 text-center"><span className="mb-3 rounded-2xl bg-[var(--soft-blue)] p-3"><Search size={21}/></span><h2 className="m-0 text-base font-semibold">{visibleTransactions.length ? "No hay movimientos con estos filtros" : "Todavía no hay movimientos"}</h2><p className="muted mb-0 mt-2 max-w-xs text-sm">{visibleTransactions.length ? "Prueba a cambiar la búsqueda o los filtros." : "Cuando apuntes un gasto o ingreso, aparecerá aquí ordenado por fecha."}</p></div>
       : <div className="motion-stagger space-y-4">{Object.entries(groups).map(([day, list]) => <TransactionDayGroup key={day} day={day} transactions={list} categories={categoryMap} pending={pending || !online} onEdit={openEdit} onRemove={remove}/>)}</div>}
    {removed && <UndoSnackbar
      key={removed.id}
      title={removed.type === "income" ? "Ingreso eliminado" : "Gasto eliminado"}
      detail={removed.description || categoryMap.get(removed.category_id || "")?.name || "Movimiento"}
      amount={`${removed.type === "income" ? "+" : "−"}${euro(removed.amount)}`}
      amountClassName={removed.type === "income" ? "text-[var(--income)]" : ""}
      icon={<CategoryIcon name={categoryMap.get(removed.category_id || "")?.icon} size={19}/>}
      onUndo={undo}
       onClose={() => { if (!restoring) closeUndo(); }}
      restoring={restoring}
      error={undoError}
    />}
  </div>;
}
