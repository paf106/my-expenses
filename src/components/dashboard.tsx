import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Category, MonthTransaction } from "@/lib/supabase/types";
import { currentMonth, euro, fromCents, monthLabel, toCents } from "@/lib/utils";
import { CategoryBreakdownCard } from "@/components/dashboard/category-breakdown-card";
import { BudgetCard } from "@/components/dashboard/budget-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export function Dashboard({ month, transactions, categories }: { month: string; transactions: MonthTransaction[]; categories: Category[] }) {
  const totalsCents = transactions.reduce((result, transaction) => {
    result[transaction.type === "income" ? "income" : "expenses"] += toCents(Number(transaction.amount));
    return result;
  }, { income: 0, expenses: 0 });
  const income = fromCents(totalsCents.income);
  const expenses = fromCents(totalsCents.expenses);
  const incomeCents = toCents(income);
  const expenseCents = toCents(expenses);
  const savingsCents = incomeCents - expenseCents;
  const savings = fromCents(savingsCents);
  const overspent = expenseCents > incomeCents;
  const noIncomeYet = incomeCents === 0 && expenseCents > 0;
  const viewingCurrentMonth = month === currentMonth();
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const categoryTotals = new Map<string, number>();
  let uncategorizedCents = 0;
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    if (!transaction.category_id || !categoryById.has(transaction.category_id)) uncategorizedCents += toCents(Number(transaction.amount));
    else categoryTotals.set(transaction.category_id, (categoryTotals.get(transaction.category_id) || 0) + toCents(Number(transaction.amount)));
  }
  const breakdown = categories.filter((category) => category.type === "expense").flatMap((category) => {
    const total = categoryTotals.get(category.id) || 0;
    return total > 0 ? [{ id: category.id, name: category.name, icon: category.icon, color: category.color, total: fromCents(total) }] : [];
  }).sort((a, b) => b.total - a.total);
  if (uncategorizedCents > 0) breakdown.push({ id: "uncategorized", name: "Sin categoría", icon: "circle-ellipsis", color: "#8993a4", total: fromCents(uncategorizedCents) });
  const categorySumCents = breakdown.reduce((sum, item) => sum + toCents(item.total), 0);
  const categorySum = fromCents(categorySumCents);
  const categorySpent = new Map(breakdown.map((item) => [item.id, item.total]));
  const spentPercent = incomeCents > 0 ? Math.min(expenseCents / incomeCents * 100, 100) : expenseCents > 0 ? 100 : 0;
  const savingsPercent = income > 0 ? Math.max(0, 100 - spentPercent) : 0;
  const recent = transactions.slice(0, 4);
   return <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2 xl:gap-6">
     <section className="card order-1 motion-enter flex h-full flex-col overflow-hidden p-5 md:p-6 xl:order-1">
       <div className="mb-6 flex items-start justify-between gap-3">
         <div className="min-w-0"><p className="muted mb-1 text-sm">{noIncomeYet ? `Gastos de ${monthLabel(month)}` : viewingCurrentMonth ? "Este mes te quedan" : `Balance de ${monthLabel(month)}`}</p><p className={`amount m-0 break-words text-[34px] font-semibold tracking-[-.05em] sm:text-[40px] ${overspent && !noIncomeYet ? "text-[var(--expense)]" : ""}`}>{noIncomeYet ? euro(expenses) : euro(savings)}</p></div>
         {viewingCurrentMonth && <div className="hidden shrink-0 items-center gap-2 rounded-full bg-[var(--soft-blue)] px-3 py-2 text-xs font-semibold text-[var(--muted)] sm:flex"><span className="h-2 w-2 rounded-full bg-[var(--income)]" /> Mes actual</div>}
      </div>
      <div className="relative mb-3 flex h-4 overflow-hidden rounded-full bg-[var(--soft-blue)]" role="img" aria-label={overspent ? `Gastos: ${euro(expenses)}, ingresos: ${euro(income)}, exceso: ${euro(expenses - income)}` : `${Math.round(spentPercent)}% de los ingresos gastados`}>
          {overspent ? <span className="h-full w-full bg-[var(--expense)]" /> : <>
          {breakdown.map((item, index) => {
            const width = income > 0 ? Math.min(item.total / income * 100, Math.max(0, 100 - breakdown.slice(0, index).reduce((sum, before) => sum + before.total / income * 100, 0))) : categorySum > 0 ? item.total / categorySum * spentPercent : 0;
            return <span key={item.id} title={`${item.name}: ${euro(item.total)}`} className="relative h-full shrink-0 first:rounded-l-full last:rounded-r-full budget-fill" style={{ width: `${width}%`, backgroundColor: item.color }} />;
          })}
          {savingsPercent > 0 && <span className="ml-auto h-full min-w-[2px] flex-1" style={{ background: "repeating-linear-gradient(135deg, transparent, transparent 4px, var(--brass) 4px, var(--brass) 6px)" }} />}
        </>}
      </div>
       <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm"><span className="muted">{euro(expenses)} gastados de {euro(income)}</span><span className={`font-semibold ${overspent && !noIncomeYet ? "text-[var(--expense)]" : "text-[var(--brass)]"}`}>{noIncomeYet ? "Aún no hay ingresos registrados" : overspent ? `${euro(fromCents(savingsCents * -1))} por encima` : `${Math.round(savingsPercent)}% ahorrado`}</span></div>
      <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
        <div className="soft-card p-4"><div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--income)_14%,transparent)] text-[var(--income)]"><ArrowDownLeft size={17} /></span>Ingresos</div><p className="amount m-0 text-lg font-semibold">{euro(income)}</p></div>
        <div className="soft-card p-4"><div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--expense)_14%,transparent)] text-[var(--expense)]"><ArrowUpRight size={17} /></span>Gastos</div><p className="amount m-0 text-lg font-semibold">{euro(expenses)}</p></div>
      </div>
    </section>

      <RecentTransactions month={month} transactions={recent} categories={categories}/>
      <BudgetCard categories={categories} spentByCategory={categorySpent}/>
      <CategoryBreakdownCard month={month} data={breakdown}/>
  </div>;
}
