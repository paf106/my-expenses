import type { Category, MonthTransaction } from "@/lib/supabase/types";
import { dateLabel, euro } from "@/lib/utils";
import { TransactionRow } from "@/components/transactions/transaction-row";

export function TransactionDayGroup({ day, transactions, categories, pending, onEdit, onRemove }: { day: string; transactions: MonthTransaction[]; categories: Map<string, Category>; pending: boolean; onEdit: (transaction: MonthTransaction) => void; onRemove: (transaction: MonthTransaction) => void }) {
  const dailyTotal = transactions.reduce((sum, row) => sum + (row.type === "income" ? row.amount : -row.amount), 0);
  return <section className="card motion-enter overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 text-sm font-semibold"><span>{dateLabel(day)}</span><span className={`amount text-xs ${dailyTotal > 0 ? "text-[var(--income)]" : "muted"}`}>{dailyTotal > 0 ? "+" : dailyTotal < 0 ? "−" : ""}{euro(Math.abs(dailyTotal))}</span></div><ul className="motion-list m-0 list-none p-0">{transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} category={categories.get(transaction.category_id || "")} pending={pending} onEdit={onEdit} onRemove={onRemove}/>)}</ul></section>;
}
