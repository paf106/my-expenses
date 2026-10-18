"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import type { Category, MonthTransaction } from "@/lib/supabase/types";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Popover } from "@/components/ui/popover";
import { euro } from "@/lib/utils";

export function TransactionRow({ transaction, category, pending, onEdit, onRemove }: {
  transaction: MonthTransaction;
  category: Category | undefined;
  pending: boolean;
  onEdit: (transaction: MonthTransaction) => void;
  onRemove: (transaction: MonthTransaction, fromKeyboard: boolean) => void;
}) {
  const income = transaction.type === "income";
  const title = transaction.description || category?.name || "Movimiento";
  const signedAmount = `${income ? "+" : "−"}${euro(transaction.amount)}`;

  return <li className="group flex items-center gap-1 border-b border-[var(--line)] p-1 last:border-0 sm:gap-2">
    <button type="button" onClick={() => onEdit(transaction)} aria-label={`Editar ${income ? "ingreso" : "gasto"}: ${title}, ${signedAmount}`} className="flex min-h-[60px] min-w-0 flex-1 items-center gap-3 rounded-xl px-2 text-left hover:bg-[var(--soft-blue)] sm:gap-4 sm:px-3">
      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: category?.color || "var(--muted)", background: category?.color ? `color-mix(in srgb, ${category.color} 14%, transparent)` : "var(--soft-blue)" }}><CategoryIcon name={category?.icon} size={18}/></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{title}</span><span className="muted mt-1 block truncate text-xs">{category?.name || "Sin categoría"}</span></span>
      <strong className={`amount shrink-0 whitespace-nowrap text-sm font-semibold ${income ? "text-[var(--income)]" : ""}`}>{signedAmount}</strong>
      <span className="sr-only">Editar movimiento</span>
    </button>
    <Popover label={`Opciones de ${title}`} panelRole="menu" align="end" trigger={({ onClick, expanded, controls, triggerRef }) => <button ref={triggerRef} type="button" aria-label={`Opciones de ${title}`} aria-haspopup="menu" aria-expanded={expanded} aria-controls={controls} onClick={onClick} className="icon-button !min-h-11 !min-w-11 shrink-0 text-[var(--muted)] hover:bg-[var(--soft-blue)] hover:text-[var(--ink)]"><MoreHorizontal size={20}/></button>}>
      {(close) => <button data-popover-item role="menuitem" type="button" disabled={pending} onClick={(event) => { const fromKeyboard = event.detail === 0; close(); onRemove(transaction, fromKeyboard); }} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-[var(--expense)] hover:bg-[var(--danger-soft)] disabled:opacity-50"><Trash2 size={16}/>Eliminar</button>}
    </Popover>
  </li>;
}
