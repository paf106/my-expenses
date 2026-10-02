"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Category, MonthTransaction } from "@/lib/supabase/types";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Popover } from "@/components/ui/popover";
import { euro } from "@/lib/utils";

export function TransactionRow({ transaction, category, pending, onEdit, onRemove }: { transaction: MonthTransaction; category: Category | undefined; pending: boolean; onEdit: (transaction: MonthTransaction) => void; onRemove: (transaction: MonthTransaction) => void }) {
  const income = transaction.type === "income";
  const title = transaction.description || category?.name || "Movimiento";
  return <li className="group flex items-center gap-3 border-b border-[var(--line)] px-4 py-3 last:border-0 sm:gap-4 sm:px-4">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: category?.color || "var(--muted)", background: category?.color ? `color-mix(in srgb, ${category.color} 14%, transparent)` : "var(--soft-blue)" }}><CategoryIcon name={category?.icon} size={18}/></span>
    <div className="min-w-0 flex-1"><p className="m-0 truncate text-sm font-medium">{transaction.description || category?.name || "Movimiento"}</p><p className="muted m-0 mt-1 truncate text-xs">{category?.name || "Sin categoría"}</p></div>
    <strong className={`amount whitespace-nowrap text-xs sm:text-sm ${income ? "text-[var(--income)]" : ""}`}>{income ? "+" : "−"}{euro(transaction.amount)}</strong>
    <Popover label={`Opciones de ${title}`} align="end" trigger={({ onClick, expanded, controls, triggerRef }) => <button ref={triggerRef} type="button" aria-label={`Opciones de ${title}`} aria-haspopup="menu" aria-expanded={expanded} aria-controls={controls} onClick={onClick} className="icon-button !min-h-11 !min-w-11 shrink-0 text-[var(--muted)] hover:bg-[var(--soft-blue)] hover:text-[var(--ink)]"><MoreHorizontal size={20}/></button>}>
      {(close) => <><button data-popover-item role="menuitem" type="button" onClick={() => { close(); onEdit(transaction); }} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-[var(--ink)] hover:bg-[var(--soft-blue)]"><Pencil size={16}/>Editar</button><button data-popover-item role="menuitem" type="button" disabled={pending} onClick={() => { close(); onRemove(transaction); }} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-[var(--expense)] hover:bg-[var(--danger-soft)] disabled:opacity-50"><Trash2 size={16}/>Eliminar</button></>}
    </Popover>
  </li>;
}
