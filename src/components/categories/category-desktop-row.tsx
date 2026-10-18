import { Trash2 } from "lucide-react";
import type { Category, TransactionType } from "@/lib/supabase/types";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CategoryIconPicker } from "@/components/ui/category-icon-picker";
import { Button } from "@/components/ui/primitives";

const colorNames: Record<string, string> = { "#7187c9": "Azul", "#df8559": "Naranja", "#8171c8": "Violeta", "#cb7ca2": "Rosa", "#5ca79a": "Verde agua", "#bd8f54": "Ocre", "#8993a4": "Gris", "#1f9d74": "Verde" };

export function CategoryDesktopRow({ item, type, colors, disabled, onUpdate, onPersist, onColor, onIcon, onRemove }: {
  item: Category;
  type: TransactionType;
  colors: string[];
  disabled: boolean;
  onUpdate: (id: string, field: "name" | "monthly_budget" | "color" | "icon", value: string) => void;
  onPersist: (id: string, field: "name" | "monthly_budget", value: string) => void;
  onColor: (item: Category, color: string) => void;
  onIcon: (item: Category, icon: string) => void;
  onRemove: (item: Category) => void;
}) {
  const budgetValue = item.monthly_budget === null ? "" : String(item.monthly_budget).replace(".", ",");
  return <article className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-[var(--line)] p-3 lg:grid-cols-[40px_minmax(120px,1fr)_minmax(120px,160px)_auto_128px_44px] lg:gap-3 lg:border-0 lg:p-0">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: item.color, backgroundColor: `color-mix(in srgb, ${item.color} 14%, transparent)` }}><CategoryIcon name={item.icon} size={18}/></span>
    <label className="min-w-0"><span className="sr-only">Nombre de categoría</span><input aria-label={`Nombre de categoría ${item.name}`} disabled={disabled} value={item.name} onChange={(event) => onUpdate(item.id, "name", event.target.value)} onBlur={(event) => onPersist(item.id, "name", event.target.value)} maxLength={48} className="control !min-h-10 min-w-0 px-3 text-sm" /></label>
    <label className="col-start-2 min-w-0 lg:col-start-auto"><span className="sr-only">Presupuesto mensual en euros</span>{type === "expense" ? <input key={`${item.id}-${budgetValue}`} aria-label={`Presupuesto mensual en euros para ${item.name}`} disabled={disabled} type="text" inputMode="decimal" defaultValue={budgetValue} onBlur={(event) => onPersist(item.id, "monthly_budget", event.target.value)} placeholder="Límite €" className="control !min-h-10 px-2 text-xs" /> : <span className="muted hidden text-xs lg:inline">Ingreso</span>}</label>
    <div className="col-start-2 grid grid-cols-4 justify-items-center gap-0.5 lg:col-start-auto" role="group" aria-label={`Color de ${item.name}`}>{colors.map((color) => <button key={color} type="button" disabled={disabled} aria-label={`Color ${colorNames[color] || "personalizado"} para ${item.name}`} aria-pressed={item.color === color} onClick={() => onColor(item, color)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-[var(--soft-blue)] lg:h-8 lg:w-8"><span aria-hidden="true" className={`h-6 w-6 rounded-full border-2 ${item.color === color ? "border-[var(--ink)] p-[3px]" : "border-transparent"}`} style={{ backgroundColor: color, backgroundClip: item.color === color ? "content-box" : undefined }} /></button>)}</div>
    <div className="col-start-2 min-w-0 lg:col-start-auto"><CategoryIconPicker value={item.icon} disabled={disabled} onChange={(icon) => onIcon(item, icon)} className="w-full" /></div>
    <Button type="button" variant="danger" disabled={disabled} onClick={() => onRemove(item)} aria-label={`Eliminar categoría ${item.name}`} className="col-start-3 row-start-1 !min-h-10 !min-w-10 !px-2 lg:col-start-auto lg:row-start-auto"><Trash2 size={16}/></Button>
  </article>;
}
