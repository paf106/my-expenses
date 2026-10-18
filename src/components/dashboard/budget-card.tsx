import Link from "next/link";
import type { Category } from "@/lib/supabase/types";
import { CategoryIcon } from "@/components/ui/category-icon";
import { euro, toCents } from "@/lib/utils";

export function BudgetCard({ categories, spentByCategory }: { categories: Category[]; spentByCategory: Map<string, number> }) {
  const allBudgets = categories.filter((category) => category.type === "expense" && category.monthly_budget !== null);
  const budgets = allBudgets.toSorted((a, b) => {
    const spentA = spentByCategory.get(a.id) || 0;
    const spentB = spentByCategory.get(b.id) || 0;
    const limitA = Number(a.monthly_budget || 0);
    const limitB = Number(b.monthly_budget || 0);
    const ratioA = limitA > 0 ? spentA / limitA : spentA > 0 ? Number.POSITIVE_INFINITY : 0;
    const ratioB = limitB > 0 ? spentB / limitB : spentB > 0 ? Number.POSITIVE_INFINITY : 0;
    return ratioB - ratioA;
  }).slice(0, 4);
  return <section className="card order-3 flex h-full flex-col p-5 md:p-6 xl:order-3">
    <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="m-0 text-base font-semibold">Tus límites</h2><p className="muted mb-0 mt-1 text-sm">Presupuestos del mes</p></div><Link href="/settings/categories" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]">Ver todos</Link></div>
    {budgets.length ? <div className="space-y-4">{budgets.map((category) => {
       const spent = spentByCategory.get(category.id) || 0;
       const limit = Number(category.monthly_budget || 0);
       const exceeded = toCents(spent) > toCents(limit);
       const percentage = limit > 0 ? Math.min(spent / limit * 100, 100) : spent > 0 ? 100 : 0;
       return <div key={category.id}><div className="mb-2 flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2 text-sm"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ color: category.color, backgroundColor: `color-mix(in srgb, ${category.color} 14%, transparent)` }}><CategoryIcon name={category.icon} size={17} /></span><span className="truncate">{category.name}</span></span><span className="amount shrink-0 text-xs font-medium">{euro(spent)} <span className="muted">/ {euro(limit)}</span></span></div><div role="progressbar" aria-label={`Presupuesto de ${category.name}`} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(spent, limit)} className="h-2 overflow-hidden rounded-full bg-[var(--soft-blue)]"><div className="budget-fill h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: exceeded ? "var(--expense)" : category.color }} /></div>{exceeded && <p className="mb-0 mt-1 text-xs font-medium text-[var(--expense)]">Superado por {euro(spent - limit)}</p>}</div>;
    })}</div> : <p className="muted m-0 text-sm">Añade límites a tus categorías para seguir tu presupuesto.</p>}
  </section>;
}
