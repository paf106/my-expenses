"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { currentMonth, pageGreeting } from "@/lib/utils";
import { TransactionDialog } from "@/components/transaction-dialog";
import { Button } from "@/components/ui/primitives";
import { TransactionDialogContext } from "@/components/transaction-dialog-context";
import type { MonthTransaction, TransactionType } from "@/lib/supabase/types";
import { Sidebar } from "@/components/app-shell/sidebar";
import { MobileNavigation } from "@/components/app-shell/mobile-navigation";
import { MonthSwitcher } from "@/components/app-shell/month-switcher";
const monthRoutes = ["/dashboard", "/transactions", "/stats"];
const addRoutes = ["/dashboard", "/transactions"];
const toMonthDate = (month: string) => new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1, 12);
const toMonthString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export function AppShell({ children, categories }: { children: React.ReactNode; categories: import("@/lib/supabase/types").Category[] }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<TransactionType>("expense");
  const [dialogSession, setDialogSession] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState<MonthTransaction | null>(null);
  const [toast, setToast] = useState("");
  const [monthPending, startMonthTransition] = useTransition();
  const showMonth = monthRoutes.includes(pathname);
  const showAdd = addRoutes.includes(pathname);
  const showMobileNav = !pathname.startsWith("/settings/");
  const defaultTransactionType = pathname === "/transactions" && search.get("type") === "income" ? "income" : "expense";
  const month = search.get("month") || currentMonth();
  const isCurrentMonth = month >= currentMonth();
  const pageTitle = pathname === "/dashboard" ? pageGreeting() : pathname.startsWith("/transactions") ? "Movimientos" : pathname === "/stats" ? "Estadísticas" : pathname === "/settings/categories" ? "Categorías y presupuestos" : pathname === "/settings/recurring" ? "Movimientos recurrentes" : pathname === "/settings/account" ? "Cuenta y apariencia" : "Ajustes";
  const onSettingsSubpage = pathname.startsWith("/settings/");

  const openQuickAdd = useCallback((requestedType?: TransactionType) => {
    setEditingTransaction(null);
    setQuickAddType(requestedType || defaultTransactionType);
    setDialogSession((session) => session + 1);
    setDialogOpen(true);
  }, [defaultTransactionType]);
  const openEdit = useCallback((transaction: MonthTransaction) => {
    setEditingTransaction(transaction);
    setQuickAddType(transaction.type);
    setDialogSession((session) => session + 1);
    setDialogOpen(true);
  }, []);

  const moveMonth = (amount: number) => {
    const next = toMonthDate(month);
    next.setMonth(next.getMonth() + amount);
    const nextMonth = toMonthString(next);
    if (nextMonth > currentMonth()) return;
    const params = new URLSearchParams(search.toString());
    params.set("month", nextMonth);
    startMonthTransition(() => router.push(`${pathname}?${params.toString()}`));
  };
  const logout = async () => { await createClient().auth.signOut(); router.push("/login"); router.refresh(); };
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  const activePath = useMemo(() => pathname.startsWith("/settings/") ? "/settings" : pathname, [pathname]);
  const dialogContext = useMemo(() => ({ openNew: openQuickAdd, openEdit }), [openQuickAdd, openEdit]);

  return <TransactionDialogContext.Provider value={dialogContext}><div className="app-shell md:flex">
    <Sidebar activePath={activePath} onLogout={logout}/>

    <div className="min-w-0 flex-1 md:ml-[248px]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--paper)]/95 py-3 backdrop-blur md:py-5">
        <div className="mx-auto flex min-h-[54px] max-w-[1240px] items-center justify-between gap-3 px-4 md:px-10">
            {onSettingsSubpage ? <Link href="/settings" aria-label="Volver a ajustes" className="icon-button shrink-0 text-[var(--muted)] no-underline md:hidden"><ArrowLeft size={20}/></Link> : null}
          <div className="min-w-0 flex-1"><h1 className="m-0 truncate text-[19px] font-semibold tracking-tight md:text-[24px]">{pageTitle}</h1></div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {showMonth && <MonthSwitcher month={month} isCurrentMonth={isCurrentMonth} pending={monthPending} onMove={moveMonth}/>}
            {showAdd && <Button onClick={() => openQuickAdd()} className="hidden min-h-11 items-center gap-2 px-4 md:inline-flex"><Plus size={17} /> Añadir</Button>}
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-[1240px] px-4 pt-5 md:px-10 md:pb-12 md:pt-6 ${showMobileNav ? "pb-[calc(env(safe-area-inset-bottom)+170px)]" : "pb-[calc(env(safe-area-inset-bottom)+32px)]"}`}>{children}</main>
    </div>

    {showMobileNav && <MobileNavigation activePath={activePath} showAdd={showAdd} onAdd={() => openQuickAdd()}/>}
    <TransactionDialog key={`${editingTransaction?.id || `new-${quickAddType}`}-${dialogSession}`} categories={categories} open={dialogOpen || Boolean(editingTransaction)} transaction={editingTransaction} defaultType={quickAddType} onClose={() => { setDialogOpen(false); setEditingTransaction(null); }} onSaved={() => { setDialogOpen(false); setEditingTransaction(null); notify("Movimiento guardado"); router.refresh(); }} />
    {toast && <div className={`fixed left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-medium text-[var(--primary-ink)] shadow-xl md:bottom-8 ${showMobileNav ? "bottom-[calc(env(safe-area-inset-bottom)+92px)]" : "bottom-[calc(env(safe-area-inset-bottom)+20px)]"}`} role="status" aria-live="polite">{toast}</div>}
  </div></TransactionDialogContext.Provider>;
}
