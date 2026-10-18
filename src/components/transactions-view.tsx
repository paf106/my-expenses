"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Category, MonthTransaction } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { currentMonth, euro, filterTransactions, fromCents, toCents } from "@/lib/utils";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionDayGroup } from "@/components/transactions/transaction-day-group";
import { useTransactionDialog } from "@/components/transaction-dialog-context";
import { CategoryIcon } from "@/components/ui/category-icon";
import { UndoSnackbar } from "@/components/ui/undo-snackbar";
import { usePwa } from "@/components/pwa-provider";

export function TransactionsView({ month, transactions, categories }: { month: string; transactions: MonthTransaction[]; categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState<MonthTransaction[]>([]);
  const [undoAutoFocus, setUndoAutoFocus] = useState(false);
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
  const [searchState, setSearchState] = useState(() => ({ urlQuery: query, draft: query }));
  if (searchState.urlQuery !== query) setSearchState({ urlQuery: query, draft: query });
  const queryDraft = searchState.draft;
  const setQueryDraft = (draft: string) => setSearchState({ urlQuery: query, draft });
  const deferredQuery = useDeferredValue(queryDraft);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const { openEdit, openNew } = useTransactionDialog();
  const removedIds = useMemo(() => new Set(removed.map((item) => item.id)), [removed]);
  const visibleTransactions = useMemo(() => transactions.filter((item) => !removedIds.has(item.id)), [transactions, removedIds]);
  const filteredTransactions = useMemo(() => filterTransactions(visibleTransactions, categories, { type: filter, category, query: deferredQuery }), [visibleTransactions, categories, filter, category, deferredQuery]);
  const groups = useMemo(() => {
    return filteredTransactions.reduce<Record<string, MonthTransaction[]>>((acc, transaction) => { (acc[transaction.date] ||= []).push(transaction); return acc; }, {});
  }, [filteredTransactions]);
  const netTotal = fromCents(filteredTransactions.reduce((sum, item) => sum + (item.type === "income" ? toCents(item.amount) : -toCents(item.amount)), 0));

  const syncParams = useCallback((type: string, q: string, selectedCategory: string) => {
    const next = new URLSearchParams(params.toString());
    if (q) next.set("q", q); else next.delete("q");
    if (type === "all") next.delete("type"); else next.set("type", type);
    if (selectedCategory === "all") next.delete("category"); else next.set("category", selectedCategory);
    const queryString = next.toString();
    window.history.replaceState(null, "", queryString ? `${pathname}?${queryString}` : pathname);
  }, [params, pathname]);
  useEffect(() => {
    if (queryDraft === query) return;
    const timer = window.setTimeout(() => syncParams(filter, queryDraft, category), 300);
    return () => window.clearTimeout(timer);
  }, [category, filter, query, queryDraft, syncParams]);
  const handleFilter = (value: string) => {
    const selectedStillMatches = categories.some((entry) => entry.id === category && (value === "all" || entry.type === value));
    const nextCategory = selectedStillMatches ? category : "all";
    syncParams(value, queryDraft, nextCategory);
  };
  const handleQuery = (value: string) => setQueryDraft(value);
  const handleCategory = (value: string) => syncParams(filter, queryDraft, value);
  const remove = (transaction: MonthTransaction, fromKeyboard = false) => {
    setActionError("");
    if (!online) { setActionError("Conéctate a internet para eliminar este movimiento."); return; }
    if (removedIds.has(transaction.id)) return;
    setRemoved((current) => [...current, transaction]);
    setUndoAutoFocus(fromKeyboard); setUndoError("");
    startTransition(async () => {
      const { error } = await createClient().from("transactions").delete().eq("id", transaction.id);
      if (error) { setRemoved((current) => current.filter((item) => item.id !== transaction.id)); setUndoAutoFocus(false); setActionError("No se pudo eliminar el movimiento. Comprueba la conexión e inténtalo de nuevo."); return; }
      router.refresh();
    });
  };
  const focusListWithoutScrolling = () => window.requestAnimationFrame(() => document.getElementById("transactions-list-title")?.focus({ preventScroll: true }));
  const closeUndo = () => { setRemoved([]); setUndoAutoFocus(false); setUndoError(""); focusListWithoutScrolling(); };
  const undo = () => {
    const latestRemoved = removed.at(-1);
    if (!latestRemoved || restoring) return;
    setRestoring(true);
    setUndoError("");
    startTransition(async () => {
      const { error } = await createClient().from("transactions").insert({ id: latestRemoved.id, created_at: latestRemoved.created_at, type: latestRemoved.type, amount: latestRemoved.amount, description: latestRemoved.description, date: latestRemoved.date, category_id: latestRemoved.category_id, recurring_id: latestRemoved.recurring_id });
      setRestoring(false);
      if (error) { setUndoError("No se pudo restaurar. Comprueba tu conexión e inténtalo de nuevo."); return; }
      const remaining = removed.filter((item) => item.id !== latestRemoved.id);
      setRemoved(remaining); setUndoAutoFocus(remaining.length ? undoAutoFocus : false); setUndoError(""); router.refresh();
      if (!remaining.length) focusListWithoutScrolling();
    });
  };
  const hasActiveFilters = filter !== "all" || category !== "all" || Boolean(queryDraft.trim());
  const clearFilters = () => { setQueryDraft(""); syncParams("all", "", "all"); };
  const latestRemoved = removed.at(-1);
  const isHistoricalMonth = month !== currentMonth();

  return <div className="motion-enter">
    <h2 id="transactions-list-title" tabIndex={-1} className="sr-only">Movimientos del periodo</h2>
    {actionError && <p role="alert" className="mb-4 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--expense)]">{actionError}</p>}
    <TransactionFilters month={month} filter={filter} query={queryDraft} category={category} categories={categories} resultCount={filteredTransactions.length} netTotal={netTotal} hasActiveFilters={hasActiveFilters} onFilter={handleFilter} onQuery={handleQuery} onCategory={handleCategory} onClear={clearFilters}/>
    {!filteredTransactions.length
       ? <div className="card flex min-h-60 flex-col items-center justify-center p-6 text-center"><span aria-hidden="true" className="mb-3 rounded-2xl bg-[var(--soft-blue)] p-3"><Search size={21}/></span><h2 className="m-0 text-base font-semibold">{hasActiveFilters ? "No hay movimientos con estos filtros" : visibleTransactions.length || isHistoricalMonth ? "No hay movimientos en este mes" : "Todavía no hay movimientos"}</h2><p className="muted mb-0 mt-2 max-w-xs text-sm">{hasActiveFilters ? "Prueba a cambiar la búsqueda o los filtros." : isHistoricalMonth ? "Elige otro mes para consultar tus movimientos." : "Cuando apuntes un gasto o ingreso, aparecerá aquí ordenado por fecha."}</p>{hasActiveFilters ? <button type="button" onClick={clearFilters} className="mt-3 min-h-11 rounded-xl px-3 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--soft-blue)]">Limpiar filtros</button> : isHistoricalMonth ? <Link href="/transactions" className="mt-3 inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--accent)] no-underline hover:bg-[var(--soft-blue)]">Ir al mes actual</Link> : !visibleTransactions.length && online && <button type="button" onClick={() => openNew("expense")} className="button-primary mt-4 inline-flex items-center gap-2 px-4">Añadir gasto</button>}</div>
       : <div className="motion-stagger space-y-4">{Object.entries(groups).map(([day, list]) => <TransactionDayGroup key={day} day={day} transactions={list} categories={categoryMap} pending={pending || !online} onEdit={openEdit} onRemove={remove}/>)}</div>}
    {latestRemoved && <UndoSnackbar
       key={latestRemoved.id}
       title={removed.length > 1 ? `${removed.length} movimientos eliminados` : latestRemoved.type === "income" ? "Ingreso eliminado" : "Gasto eliminado"}
       detail={latestRemoved.description || categoryMap.get(latestRemoved.category_id || "")?.name || "Movimiento"}
       amount={`${latestRemoved.type === "income" ? "+" : "−"}${euro(latestRemoved.amount)}`}
       amountClassName={latestRemoved.type === "income" ? "text-[var(--income)]" : ""}
       icon={<CategoryIcon name={categoryMap.get(latestRemoved.category_id || "")?.icon} size={19}/>}
       onUndo={undo}
       onClose={() => { if (!restoring) closeUndo(); }}
       restoring={restoring}
       error={undoError}
       autoFocus={undoAutoFocus}
    />}
  </div>;
}
