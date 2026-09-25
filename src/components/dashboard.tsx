"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Wallet } from "lucide-react";
import { useMemo } from "react";
import type { Category, Transaction } from "@/lib/supabase/types";
import { currentMonth, dateLabel, euro } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/category-icon";

const CategoryChart = dynamic(() => import("@/components/charts").then((module) => module.CategoryChart), {
  ssr: false,
  loading: () => <div className="mx-auto aspect-square w-full max-w-[210px] animate-pulse rounded-full bg-[var(--soft-blue)]" />,
});

export function Dashboard({ month, transactions, categories, summary }: { month: string; transactions: Transaction[]; categories: Category[]; summary: { income: number; expenses: number; savings: number } }) {
  const income = Number(summary.income);
  const expenses = Number(summary.expenses);
  const savings = income - expenses;
  const overspent = expenses > income;
  const breakdown = useMemo(() => {
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const totals = new Map<string, number>();
    let uncategorized = 0;
    for (const transaction of transactions) {
      if (transaction.type !== "expense") continue;
      if (!transaction.category_id || !categoryById.has(transaction.category_id)) uncategorized += Number(transaction.amount);
      else totals.set(transaction.category_id, (totals.get(transaction.category_id) || 0) + Number(transaction.amount));
    }
    const items = categories.filter((category) => category.type === "expense").flatMap((category) => {
      const total = totals.get(category.id) || 0;
      return total > 0 ? [{ ...category, total }] : [];
    }).sort((a, b) => b.total - a.total);
    if (uncategorized > 0) items.push({ id: "uncategorized", user_id: "", name: "Sin categoría", type: "expense", icon: "circle-ellipsis", color: "#8993a4", monthly_budget: null, archived: false, created_at: "", total: uncategorized });
    return items;
  }, [categories, transactions]);
  const categorySum = breakdown.reduce((sum, item) => sum + item.total, 0);
  const spentPercent = income > 0 ? Math.min(expenses / income * 100, 100) : expenses > 0 ? 100 : 0;
  const savingsPercent = income > 0 ? Math.max(0, 100 - spentPercent) : 0;
  const recent = transactions.slice(0, 4);
  const budgets = categories.filter((category) => category.type === "expense" && category.monthly_budget !== null).slice(0, 4);
  return <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2 xl:gap-6">
    <section className="card flex h-full flex-col overflow-hidden p-5 md:p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="muted mb-1 text-sm">{overspent ? "Has gastado por encima de tus ingresos" : "Este mes te quedan"}</p><p className={`amount m-0 break-words text-[34px] font-semibold tracking-[-.05em] sm:text-[40px] ${overspent ? "text-[var(--expense)]" : ""}`}>{euro(Math.abs(savings))}{overspent ? " por encima" : ""}</p></div>
        {month === currentMonth() && <div className="hidden shrink-0 items-center gap-2 rounded-full bg-[var(--soft-blue)] px-3 py-2 text-xs font-semibold text-[var(--muted)] sm:flex"><span className="h-2 w-2 rounded-full bg-[var(--income)]" /> Mes actual</div>}
      </div>
      <div className="relative mb-3 flex h-4 overflow-hidden rounded-full bg-[var(--soft-blue)]" role="img" aria-label={overspent ? `Gastos: ${euro(expenses)}, ingresos: ${euro(income)}, exceso: ${euro(expenses - income)}` : `${Math.round(spentPercent)}% de los ingresos gastados`}>
        {overspent ? <span className="h-full w-full bg-[var(--expense)]" /> : <>
          {breakdown.map((item, index) => {
            const width = income > 0 ? Math.min(item.total / income * 100, Math.max(0, 100 - breakdown.slice(0, index).reduce((sum, before) => sum + before.total / income * 100, 0))) : categorySum > 0 ? item.total / categorySum * spentPercent : 0;
            return <span key={item.id} title={`${item.name}: ${euro(item.total)}`} className="relative h-full shrink-0 first:rounded-l-full last:rounded-r-full" style={{ width: `${width}%`, backgroundColor: item.color }} />;
          })}
          {savingsPercent > 0 && <span className="ml-auto h-full min-w-[2px] flex-1" style={{ background: "repeating-linear-gradient(135deg, transparent, transparent 4px, var(--brass) 4px, var(--brass) 6px)" }} />}
        </>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm"><span className="muted">{euro(expenses)} gastados de {euro(income)}</span><span className={`font-semibold ${overspent ? "text-[var(--expense)]" : "text-[var(--brass)]"}`}>{overspent ? `${euro(expenses - income)} por encima` : `${Math.round(savingsPercent)}% ahorrado`}</span></div>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
        <div className="soft-card p-4"><div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--income)_14%,transparent)] text-[var(--income)]"><ArrowDownLeft size={17} /></span>Ingresos</div><p className="amount m-0 text-lg font-semibold">{euro(income)}</p></div>
        <div className="soft-card p-4"><div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--expense)_14%,transparent)] text-[var(--expense)]"><ArrowUpRight size={17} /></span>Gastos</div><p className="amount m-0 text-lg font-semibold">{euro(expenses)}</p></div>
      </div>
    </section>

    <section className="card flex h-full min-w-0 flex-col p-5 md:p-6">
      <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="m-0 text-base font-semibold">A dónde va</h2><p className="muted mb-0 mt-1 text-sm">Gastos por categoría</p></div><Link href="/stats" className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]">Ver más <ArrowRight size={15} /></Link></div>
      <div className="grid flex-1 grid-cols-[minmax(120px,1fr)_minmax(100px,.9fr)] items-center gap-3 sm:gap-5">
         <div className="relative mx-auto w-full max-w-[210px]"><CategoryChart data={breakdown.map(({ name, total, color }) => ({ name, value: total, color }))} height={210} />{breakdown.length > 0 && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="muted text-[11px]">Total</span><strong className="amount text-sm">{euro(categorySum)}</strong></div>}</div>
        <ul className="m-0 flex min-w-0 list-none flex-col gap-3 p-0">{breakdown.length ? breakdown.slice(0, 4).map((item) => <li key={item.id} className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="min-w-0 flex-1 truncate text-xs sm:text-sm">{item.name}</span><strong className="amount shrink-0 text-xs font-medium">{euro(item.total)}</strong></li>) : <li className="muted text-sm">Apunta tu primer gasto para ver el desglose.</li>}</ul>
      </div>
    </section>

    <section className="card flex h-full flex-col p-5 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="m-0 text-base font-semibold">Tus límites</h2><p className="muted mb-0 mt-1 text-sm">Presupuestos del mes</p></div><Link href="/settings/categories" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]">Editar</Link></div>
      {budgets.length ? <div className="space-y-4">{budgets.map((category) => {
        const spent = transactions.filter((transaction) => transaction.category_id === category.id && transaction.type === "expense").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
        const limit = Number(category.monthly_budget || 0);
        const percentage = limit > 0 ? Math.min(spent / limit * 100, 100) : 0;
        return <div key={category.id}><div className="mb-2 flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2 text-sm"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ color: category.color, backgroundColor: `color-mix(in srgb, ${category.color} 14%, transparent)` }}><CategoryIcon name={category.icon} size={17} /></span><span className="truncate">{category.name}</span></span><span className="amount shrink-0 text-xs font-medium">{euro(spent)} <span className="muted">/ {euro(limit)}</span></span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--soft-blue)]"><div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: spent > limit ? "var(--expense)" : category.color }} /></div></div>;
      })}</div> : <p className="muted m-0 text-sm">Añade límites a tus categorías para seguir tu presupuesto.</p>}
    </section>

    <section className="card flex h-full flex-col p-5 md:p-6">
      <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="m-0 text-base font-semibold">Últimos movimientos</h2><p className="muted mb-0 mt-1 text-sm">Lo más reciente de tu mes</p></div><Link href="/transactions" className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]">Ver todos <ArrowRight size={15} /></Link></div>
      {recent.length ? <ul className="m-0 list-none divide-y divide-[var(--line)] p-0">{recent.map((transaction) => <li key={transaction.id} className="flex items-center gap-3 py-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: transaction.category?.color || "var(--muted)", backgroundColor: transaction.category?.color ? `color-mix(in srgb, ${transaction.category.color} 14%, transparent)` : "var(--soft-blue)" }}><CategoryIcon name={transaction.category?.icon} size={18} /></span><div className="min-w-0 flex-1"><p className="m-0 truncate text-sm font-medium">{transaction.description || transaction.category?.name || "Movimiento"}</p><p className="muted m-0 mt-1 text-xs">{transaction.category?.name || "Sin categoría"} · {dateLabel(transaction.date)}</p></div><span className={`amount shrink-0 whitespace-nowrap text-xs font-semibold sm:text-sm ${transaction.type === "income" ? "text-[var(--income)]" : ""}`}>{transaction.type === "income" ? "+" : "−"}{euro(transaction.amount)}</span></li>)}</ul> : <div className="flex min-h-32 flex-1 flex-col items-center justify-center text-center"><span className="mb-2 rounded-xl bg-[var(--soft-blue)] p-3"><Wallet size={20} /></span><p className="m-0 text-sm font-medium">Todavía no hay movimientos</p><p className="muted mt-1 text-xs">Pulsa + y apunta el primero.</p></div>}
    </section>
  </div>;
}
