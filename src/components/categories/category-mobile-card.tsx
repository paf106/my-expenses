import type { Category, TransactionType } from "@/lib/supabase/types";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ChevronRightIcon } from "@/components/ui/chevron-right-icon";

export function CategoryMobileCard({ item, type, onSelect }: { item: Category; type: TransactionType; onSelect: (item: Category) => void }) {
  const budget = item.monthly_budget === null ? "Sin límite" : `Límite ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", useGrouping: "always" }).format(item.monthly_budget)}`;
  return <button type="button" onClick={() => onSelect(item)} className="card flex min-h-[68px] w-full items-center gap-3 p-3 text-left">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: item.color, backgroundColor: `color-mix(in srgb, ${item.color} 14%, transparent)` }}><CategoryIcon name={item.icon} size={19}/></span>
    <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold">{item.name}</strong><small className="muted mt-1 block truncate text-xs">{type === "expense" ? budget : "Ingreso"}</small></span>
    <ChevronRightIcon className="shrink-0 text-[var(--muted)]" />
  </button>;
}
