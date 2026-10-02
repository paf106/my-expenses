"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ChartNoAxesColumn, House, LogOut, Plus, Settings, WalletCards } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { currentMonth, monthLabel, pageGreeting } from "@/lib/utils";
import { TransactionDialog } from "@/components/transaction-dialog";
import { IconButton } from "@/components/ui/primitives";
import { TransactionDialogContext } from "@/components/transaction-dialog-context";
import type { Transaction, TransactionType } from "@/lib/supabase/types";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/transactions", label: "Movimientos", icon: WalletCards },
  { href: "/stats", label: "Estadísticas", icon: ChartNoAxesColumn },
  { href: "/settings", label: "Ajustes", icon: Settings },
];
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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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

  const openQuickAdd = (requestedType?: TransactionType) => {
    setEditingTransaction(null);
    setQuickAddType(requestedType || defaultTransactionType);
    setDialogSession((session) => session + 1);
    setDialogOpen(true);
  };
  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setQuickAddType(transaction.type);
    setDialogSession((session) => session + 1);
    setDialogOpen(true);
  };

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

  return <TransactionDialogContext.Provider value={{ openNew: openQuickAdd, openEdit }}><div className="app-shell md:flex">
    <aside className="sidebar fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col px-5 py-7 md:flex">
      <Link href="/dashboard" className="mb-9 flex items-center gap-3 px-2 no-underline">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-xl font-bold text-[var(--primary-ink)]">€</span>
        <span><strong className="block text-[17px] tracking-tight">Mis Gastos</strong><small className="muted">Finanzas en calma</small></span>
      </Link>
      <nav className="flex flex-col gap-1" aria-label="Navegación principal">
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={activePath === href ? "page" : undefined} className="nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium no-underline"><Icon size={19} strokeWidth={1.8} />{label}</Link>)}
      </nav>
      <div className="mt-auto border-t border-[var(--line)] pt-4">
        <button onClick={logout} className="nav-link flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm"><LogOut size={18} />Cerrar sesión</button>
      </div>
    </aside>

    <div className="min-w-0 flex-1 md:ml-[248px]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--paper)]/95 py-3 backdrop-blur md:py-5">
        <div className="mx-auto flex min-h-[54px] max-w-[1240px] items-center justify-between gap-3 px-4 md:px-10">
            {onSettingsSubpage ? <Link href="/settings" aria-label="Volver a ajustes" className="icon-button shrink-0 text-[var(--muted)] no-underline md:hidden"><ArrowLeft size={20}/></Link> : null}
          <div className="min-w-0 flex-1"><h1 className="m-0 truncate text-[19px] font-semibold tracking-tight md:text-[24px]">{pageTitle}</h1></div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {showMonth && <div className="flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] p-0.5">
              <IconButton aria-label="Mes anterior" onClick={() => moveMonth(-1)} className="min-w-10"><ArrowLeft size={17} /></IconButton>
              <span aria-live="polite" className={`min-w-[96px] px-1 text-center text-xs font-semibold transition-opacity sm:min-w-[124px] sm:text-sm ${monthPending ? "opacity-45" : ""}`}>{monthLabel(month)}</span>
              <IconButton aria-label="Mes siguiente" disabled={isCurrentMonth} onClick={() => moveMonth(1)} className="min-w-10 disabled:cursor-not-allowed disabled:opacity-35"><ArrowRight size={17} /></IconButton>
            </div>}
            {showAdd && <button onClick={() => openQuickAdd()} className="button-primary hidden min-h-11 items-center gap-2 px-4 md:inline-flex"><Plus size={17} /> Añadir</button>}
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-[1240px] px-4 pt-5 md:px-10 md:pb-12 md:pt-6 ${showMobileNav ? "pb-[calc(env(safe-area-inset-bottom)+170px)]" : "pb-[calc(env(safe-area-inset-bottom)+32px)]"}`}>{children}</main>
    </div>

    {showMobileNav && <div className="mobile-nav-row fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-3 right-3 z-30 flex items-center gap-2.5 md:hidden">
      <nav aria-label="Navegación móvil" className={`mobile-nav-float grid min-w-0 flex-1 grid-cols-4 gap-0.5 p-1.5 ${showAdd ? "" : "w-full"}`}>
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={activePath === href ? "page" : undefined} className={`mobile-nav-link flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[20px] text-[10px] no-underline ${activePath === href ? "is-active" : ""}`}><span className="mobile-nav-icon"><Icon size={20} strokeWidth={2}/></span><span className="truncate">{label}</span></Link>)}
      </nav>
      {showAdd && <button aria-label="Añadir movimiento" onClick={() => openQuickAdd()} className="mobile-fab flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full"><Plus size={25} strokeWidth={2.2} /></button>}
    </div>}
    <TransactionDialog key={`${editingTransaction?.id || `new-${quickAddType}`}-${dialogSession}`} categories={categories} open={dialogOpen || Boolean(editingTransaction)} transaction={editingTransaction} defaultType={quickAddType} onClose={() => { setDialogOpen(false); setEditingTransaction(null); }} onSaved={() => { setDialogOpen(false); setEditingTransaction(null); notify("Movimiento guardado"); router.refresh(); }} />
    {toast && <div className={`fixed left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-medium text-[var(--primary-ink)] shadow-xl md:bottom-8 ${showMobileNav ? "bottom-[calc(env(safe-area-inset-bottom)+92px)]" : "bottom-[calc(env(safe-area-inset-bottom)+20px)]"}`} role="status" aria-live="polite">{toast}</div>}
  </div></TransactionDialogContext.Provider>;
}
