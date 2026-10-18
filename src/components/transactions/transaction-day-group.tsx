import type { Category, MonthTransaction } from "@/lib/supabase/types";
import { euro, fromCents, toCents, transactionDayLabel } from "@/lib/utils";
import { TransactionRow } from "@/components/transactions/transaction-row";

export function TransactionDayGroup({ day, transactions, categories, pending, onEdit, onRemove }: { day: string; transactions: MonthTransaction[]; categories: Map<string, Category>; pending: boolean; onEdit: (transaction: MonthTransaction) => void; onRemove: (transaction: MonthTransaction, fromKeyboard: boolean) => void }) {
  const totalCents = transactions.reduce((sum, row) => sum + (row.type === "income" ? toCents(row.amount) : -toCents(row.amount)), 0);
  const dailyTotal = fromCents(totalCents);
  return <section className="card motion-enter"><div className="sticky top-[calc(env(safe-area-inset-top)+76px)] z-10 flex items-center justify-between rounded-t-[19px] border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold shadow-sm md:top-[calc(env(safe-area-inset-top)+96px)]"><h2 className="m-0 text-sm font-semibold">{transactionDayLabel(day)}</h2><span className={`amount text-xs ${totalCents > 0 ? "text-[var(--income)]" : "muted"}`}>{totalCents > 0 ? "+" : totalCents < 0 ? "−" : ""}{euro(Math.abs(dailyTotal))}</span></div><ul className="motion-list m-0 list-none p-0">{transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} category={categories.get(transaction.category_id || "")} pending={pending} onEdit={onEdit} onRemove={onRemove}/>)}</ul></section>;
}
