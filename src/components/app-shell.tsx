"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { currentMonth, dateLabel, euro, localToday, parseMonth } from "@/lib/utils";
import { TransactionDialog, type SavedMovement } from "@/components/transaction-dialog";
import { UndoSnackbar } from "@/components/ui/undo-snackbar";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Button } from "@/components/ui/primitives";
import { TransactionDialogContext } from "@/components/transaction-dialog-context";
import type { MonthTransaction, TransactionType } from "@/lib/supabase/types";
import { Sidebar } from "@/components/app-shell/sidebar";
import { MobileNavigation } from "@/components/app-shell/mobile-navigation";
import { MonthSwitcher } from "@/components/app-shell/month-switcher";
import { clearOfflineCache, usePwa } from "@/components/pwa-provider";
const monthRoutes = ["/dashboard", "/transactions", "/stats"];
const addRoutes = ["/dashboard", "/transactions"];
const toMonthDate = (month: string) => new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1, 12);
const toMonthString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const subscribeMonthChanges = (callback: () => void) => {
  window.addEventListener("focus", callback);
  document.addEventListener("visibilitychange", callback);
  return () => { window.removeEventListener("focus", callback); document.removeEventListener("visibilitychange", callback); };
};

export function AppShell({ children, categories, initialMonth }: { children: React.ReactNode; categories: import("@/lib/supabase/types").Category[]; initialMonth: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<TransactionType>("expense");
  const [dialogSession, setDialogSession] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState<MonthTransaction | null>(null);
  const [savedMovement, setSavedMovement] = useState<SavedMovement | null>(null);
  const [undoSavedPending, startUndoSavedTransition] = useTransition();
  const [undoSavedError, setUndoSavedError] = useState("");
  const openTimer = useRef<number | null>(null);
  const targetMonth = useRef<string | null>(null);
  const [monthPending, startMonthTransition] = useTransition();
  const { online } = usePwa();
  const monthToday = useSyncExternalStore(subscribeMonthChanges, currentMonth, () => initialMonth);
  const showMonth = monthRoutes.includes(pathname);
  const showAdd = addRoutes.includes(pathname);
  const showMobileNav = !pathname.startsWith("/settings/");
  const defaultTransactionType = pathname === "/transactions" && search.get("type") === "income" ? "income" : "expense";
  const month = parseMonth(search.get("month")) || monthToday;
  const isCurrentMonth = month >= monthToday;
  const pageTitle = pathname === "/dashboard" ? "Inicio" : pathname.startsWith("/transactions") ? "Movimientos" : pathname === "/stats" ? "Estadísticas" : pathname === "/settings/categories" ? "Categorías y presupuestos" : pathname === "/settings/recurring" ? "Movimientos recurrentes" : pathname === "/settings/account" ? "Cuenta y apariencia" : "Ajustes";
  const onSettingsSubpage = pathname.startsWith("/settings/");

  const openQuickAdd = useCallback((requestedType?: TransactionType) => {
    if (!online) return;
    setEditingTransaction(null);
    setQuickAddType(requestedType || defaultTransactionType);
    setDialogSession((session) => session + 1);
    setDialogOpen(true);
  }, [defaultTransactionType, online]);
  const openEdit = useCallback((transaction: MonthTransaction) => {
    setEditingTransaction(transaction);
    setQuickAddType(transaction.type);
    setDialogSession((session) => session + 1);
    setDialogOpen(true);
  }, []);

  useEffect(() => {
    const requestedType = search.get("add");
    if (!online || (requestedType !== "expense" && requestedType !== "income")) return;
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => { openTimer.current = null; openQuickAdd(requestedType); }, 0);
    const params = new URLSearchParams(search.toString());
    params.delete("add");
    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }, [online, openQuickAdd, pathname, router, search]);

  useEffect(() => { targetMonth.current = month; }, [month]);
  useEffect(() => () => { if (openTimer.current !== null) window.clearTimeout(openTimer.current); }, []);

  const moveMonth = (amount: number) => {
    const next = toMonthDate(targetMonth.current || month);
    next.setMonth(next.getMonth() + amount);
    const nextMonth = toMonthString(next);
    if (nextMonth > monthToday) return;
    const params = new URLSearchParams(search.toString());
    params.set("month", nextMonth);
    targetMonth.current = nextMonth;
    startMonthTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  };
  const logout = async () => { await clearOfflineCache(); await createClient().auth.signOut(); router.push("/login"); router.refresh(); };
  const closeSavedNotice = () => { if (!undoSavedPending) { setSavedMovement(null); setUndoSavedError(""); } };
  const undoSaved = () => {
    if (!savedMovement || undoSavedPending) return;
    if (!online) { setUndoSavedError("Conéctate a internet para deshacer este cambio."); return; }
    setUndoSavedError("");
    startUndoSavedTransition(async () => {
      const supabase = createClient();
      const { current, previous } = savedMovement;
      const result = previous
        ? await supabase.from("transactions").update({ type: previous.type, amount: previous.amount, description: previous.description, category_id: previous.category_id, recurring_id: previous.recurring_id, date: previous.date }).eq("id", current.id)
        : await supabase.from("transactions").delete().eq("id", current.id);
      if (result.error) { setUndoSavedError("No se pudo deshacer. Comprueba tu conexión e inténtalo de nuevo."); return; }
      setSavedMovement(null);
      router.refresh();
    });
  };
  const activePath = useMemo(() => pathname.startsWith("/settings/") ? "/settings" : pathname, [pathname]);
  const dialogContext = useMemo(() => ({ openNew: openQuickAdd, openEdit }), [openQuickAdd, openEdit]);

  return <TransactionDialogContext.Provider value={dialogContext}><div className="app-shell md:flex">
    <a href="#main-content" className="sr-only fixed left-3 top-3 z-[100] rounded-xl bg-[var(--surface)] px-4 py-3 font-semibold text-[var(--ink)] shadow-xl focus:not-sr-only">Saltar al contenido</a>
    <Sidebar activePath={activePath} onLogout={logout}/>

    <div className="min-w-0 flex-1 md:ml-[248px]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--paper)]/95 pt-[env(safe-area-inset-top)] pb-3 backdrop-blur md:py-5">
        <div className="mx-auto flex min-h-[54px] max-w-[1240px] items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-10">
            {onSettingsSubpage ? <Link href="/settings" aria-label="Volver a ajustes" className="icon-button shrink-0 text-[var(--muted)] no-underline md:hidden"><ArrowLeft size={20}/></Link> : null}
          <div className="min-w-0 flex-1"><h1 className="m-0 truncate text-[19px] font-semibold tracking-tight md:text-[24px]">{pageTitle}</h1></div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {showMonth && <MonthSwitcher month={month} isCurrentMonth={isCurrentMonth} pending={monthPending} onMove={moveMonth}/>}
            {showAdd && <Button disabled={!online} title={!online ? "Vuelve a conectarte para añadir movimientos" : undefined} onClick={() => openQuickAdd()} className="max-md:hidden min-h-11 items-center gap-2 px-4"><Plus size={17} /> Añadir</Button>}
          </div>
        </div>
      </header>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{online ? "" : "Sin conexión. Estás viendo los últimos datos guardados."}</div>
      {!online && <div aria-hidden="true" className="sticky top-[calc(env(safe-area-inset-top)+72px)] z-10 mx-4 mt-2 rounded-xl border border-[var(--line)] bg-[var(--soft-blue)] px-4 py-2 text-center text-xs text-[var(--ink)] md:top-[calc(env(safe-area-inset-top)+96px)] md:mx-10">Sin conexión · Estás viendo los últimos datos guardados</div>}
      <main id="main-content" aria-busy={monthPending || undefined} className={`mx-auto max-w-[1240px] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-5 md:px-10 md:pb-12 md:pt-6 ${showMobileNav ? "pb-[calc(env(safe-area-inset-bottom)+170px)]" : "pb-[calc(env(safe-area-inset-bottom)+32px)]"}`}>{children}</main>
    </div>

    {showMobileNav && <MobileNavigation activePath={activePath} month={month} showAdd={showAdd} offline={!online} onAdd={() => openQuickAdd()}/>}
    <TransactionDialog key={`${editingTransaction?.id || `new-${quickAddType}`}-${dialogSession}`} categories={categories} open={dialogOpen || Boolean(editingTransaction)} transaction={editingTransaction} defaultType={quickAddType} offline={!online} onClose={() => { setDialogOpen(false); setEditingTransaction(null); }} onSaved={(saved) => { setDialogOpen(false); setEditingTransaction(null); setSavedMovement(saved); setUndoSavedError(""); router.refresh(); }} />
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{savedMovement ? `${savedMovement.previous ? "Cambios guardados" : savedMovement.current.type === "income" ? "Ingreso guardado" : "Gasto guardado"}. Puedes deshacerlo o añadir otro.` : ""}</div>
    {savedMovement && <UndoSnackbar
      key={savedMovement.current.id}
      title={savedMovement.previous ? "Cambios guardados" : savedMovement.current.type === "income" ? "Ingreso guardado" : "Gasto guardado"}
       detail={`${savedMovement.current.description || categories.find((item) => item.id === savedMovement.current.category_id)?.name || "Movimiento"}${savedMovement.current.date !== localToday() ? ` · ${dateLabel(savedMovement.current.date)}` : ""}`}
      amount={`${savedMovement.current.type === "income" ? "+" : "−"}${euro(savedMovement.current.amount)}`}
      amountClassName={savedMovement.current.type === "income" ? "text-[var(--income)]" : ""}
      icon={<CategoryIcon name={categories.find((item) => item.id === savedMovement.current.category_id)?.icon} size={19}/>}
      onUndo={undoSaved}
      onClose={closeSavedNotice}
      restoring={undoSavedPending}
      error={undoSavedError}
      live={false}
      secondaryAction={!savedMovement.previous ? { label: "Añadir otro", onClick: () => { if (!online) { setUndoSavedError("Conéctate a internet para apuntar otro movimiento."); return; } const type = savedMovement.current.type; closeSavedNotice(); openQuickAdd(type); } } : undefined}
    />}
  </div></TransactionDialogContext.Provider>;
}
