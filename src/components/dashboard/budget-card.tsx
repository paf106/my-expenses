import Link from "next/link";
import type { Category } from "@/lib/supabase/types";
import { CategoryIcon } from "@/components/ui/category-icon";
import { euro } from "@/lib/utils";

export function BudgetCard({ categories, spentByCategory }: { categories: Category[]; spentByCategory: Map<string, number> }) {
  const budgets = categories.filter((category) => category.type === "expense" && category.monthly_budget !== null).slice(0, 4);
  return <section className="card flex h-full flex-col p-5 md:p-6">
    <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="m-0 text-base font-semibold">Tus límites</h2><p className="muted mb-0 mt-1 text-sm">Presupuestos del mes</p></div><Link href="/settings/categories" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]">Editar</Link></div>
    {budgets.length ? <div className="space-y-4">{budgets.map((category) => {
      const spent = spentByCategory.get(category.id) || 0;
      const limit = Number(category.monthly_budget || 0);
      const percentage = limit > 0 ? Math.min(spent / limit * 100, 100) : 0;
      return <div key={category.id}><div className="mb-2 flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2 text-sm"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ color: category.color, backgroundColor: `color-mix(in srgb, ${category.color} 14%, transparent)` }}><CategoryIcon name={category.icon} size={17} /></span><span className="truncate">{category.name}</span></span><span className="amount shrink-0 text-xs font-medium">{euro(spent)} <span className="muted">/ {euro(limit)}</span></span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--soft-blue)]"><div className="budget-fill h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: spent > limit ? "var(--expense)" : category.color }} /></div></div>;
    })}</div> : <p className="muted m-0 text-sm">Añade límites a tus categorías para seguir tu presupuesto.</p>}
  </section>;
}
