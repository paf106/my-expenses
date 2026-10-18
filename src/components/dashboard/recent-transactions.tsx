"use client";

import type { Category, MonthTransaction } from "@/lib/supabase/types";
import Link from "next/link";
import { currentMonth, dateLabel, euro } from "@/lib/utils";
import { useTransactionDialog } from "@/components/transaction-dialog-context";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet } from "lucide-react";

export function RecentTransactions({ month, transactions, categories }: { month: string; transactions: MonthTransaction[]; categories: Category[] }) {
  const { openEdit } = useTransactionDialog();
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return <section className="card order-2 flex h-full flex-col p-5 md:p-6 xl:order-4">
    <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="m-0 text-base font-semibold">Últimos movimientos</h2><p className="muted mb-0 mt-1 text-sm">Toca uno para corregirlo</p></div><Link href={month === currentMonth() ? "/transactions" : `/transactions?month=${month}`} className="inline-flex min-h-11 shrink-0 items-center rounded-xl px-2 text-sm font-semibold text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]">Ver todos</Link></div>
    {transactions.length ? <ul className="motion-list m-0 list-none divide-y divide-[var(--line)] p-0">{transactions.map((transaction) => {
      const category = transaction.category_id ? categoryById.get(transaction.category_id) : null;
      const title = transaction.description || category?.name || "Movimiento";
      const sign = transaction.type === "income" ? "+" : "−";
      return <li key={transaction.id} className="py-1">
        <button type="button" onClick={() => openEdit(transaction)} aria-label={`Editar ${transaction.type === "income" ? "ingreso" : "gasto"}: ${title}, ${sign}${euro(transaction.amount)}`} className="flex min-h-[60px] w-full min-w-0 items-center gap-3 rounded-xl px-2 text-left hover:bg-[var(--soft-blue)]">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: category?.color || "var(--muted)", backgroundColor: category?.color ? `color-mix(in srgb, ${category.color} 14%, transparent)` : "var(--soft-blue)" }}><CategoryIcon name={category?.icon} size={18}/></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{title}</span><span className="muted mt-1 block truncate text-xs">{category?.name || "Sin categoría"} · {dateLabel(transaction.date)}</span></span>
          <strong className={`amount shrink-0 whitespace-nowrap text-sm font-semibold ${transaction.type === "income" ? "text-[var(--income)]" : ""}`}>{sign}{euro(transaction.amount)}</strong>
        </button>
      </li>;
    })}</ul> : <EmptyState icon={<Wallet size={20}/>} title="Todavía no hay movimientos" description="Pulsa + y apunta el primero."/>}
  </section>;
}
