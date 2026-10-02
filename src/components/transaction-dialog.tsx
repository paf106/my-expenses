"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, TransactionType } from "@/lib/supabase/types";
import { X } from "lucide-react";
import type { Transaction } from "@/lib/supabase/types";
import { localToday } from "@/lib/utils";
import { Button, Select } from "@/components/ui/primitives";
import { useSheetDismiss } from "@/components/ui/use-sheet-dismiss";

export function TransactionDialog({ open, transaction, categories, onCategoriesChanged, defaultType = "expense", onClose, onSaved }: { open: boolean; transaction?: Transaction | null; categories: Category[]; onCategoriesChanged: (categories: Category[]) => void; defaultType?: TransactionType; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<TransactionType>(transaction?.type || defaultType);
  const [amount, setAmount] = useState(transaction ? String(transaction.amount).replace(".", ",") : "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id || "");
  const [date, setDate] = useState(transaction?.date || localToday());
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const { closing, dismiss } = useSheetDismiss(onClose);
  useEffect(() => { const element = dialog.current; if (!element) return; if (open && !element.open) element.showModal(); if (!open && element.open) element.close(); }, [open]);
  const options = categories.filter((category) => category.type === type);
  const close = (callback: () => void, force = false) => {
    if (pending && !force) return;
    dismiss(() => {
      const element = dialog.current;
      if (element?.open) element.close();
      callback();
    });
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const numericAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError("Escribe un importe mayor que cero."); return; }
    startTransition(async () => {
      const supabase = createClient();
      const values = { type, amount: numericAmount, description: description.trim(), category_id: categoryId || null, date };
      const { error: saveError } = transaction ? await supabase.from("transactions").update(values).eq("id", transaction.id) : await supabase.from("transactions").insert(values);
      if (saveError) { setError(saveError.message.includes("Failed to fetch") ? "No se pudo conectar. Comprueba tu conexión y vuelve a intentarlo." : "No se pudo guardar. Inicia sesión y asegúrate de haber aplicado el esquema de Supabase."); return; }
      if (categoryId) {
        const selectedCategory = categories.find((item) => item.id === categoryId);
        if (selectedCategory) onCategoriesChanged(categories.map((item) => item.id === categoryId ? selectedCategory : item));
      }
      setAmount(""); setDescription(""); setCategoryId(""); close(onSaved, true);
    });
  };
  return <dialog ref={dialog} className={`dialog-sheet${closing ? " is-closing" : ""}`} onCancel={(event) => { event.preventDefault(); close(onClose); }} onClick={(event) => { if (event.target === dialog.current) close(onClose); }}>
    <form onSubmit={submit} className="max-h-[90dvh] overflow-y-auto p-5 pb-[max(env(safe-area-inset-bottom),24px)] sm:p-7">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="m-0 text-xl font-semibold">{transaction ? "Editar movimiento" : "Nuevo movimiento"}</h2></div><button type="button" onClick={() => close(onClose)} aria-label="Cerrar" className="icon-button text-[var(--muted)] hover:bg-[var(--soft-blue)]"><X size={19} /></button></div>
      <div className="mb-5 grid grid-cols-2 rounded-xl bg-[var(--soft-blue)] p-1">
        {(["expense", "income"] as const).map((item) => <button key={item} type="button" onClick={() => { setType(item); setCategoryId(""); }} className={`min-h-11 rounded-lg text-sm font-semibold ${type === item ? "bg-[var(--surface)] shadow-sm" : "muted"}`}>{item === "expense" ? "Gasto" : "Ingreso"}</button>)}
      </div>
      <label className="field-label" htmlFor="movement-amount">Importe</label>
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 focus-within:border-[var(--focus)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--focus)_25%,transparent)]"><span className="muted text-2xl">€</span><input id="movement-amount" required type="text" inputMode="decimal" autoFocus value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" className="amount min-h-[72px] w-full bg-transparent text-[36px] font-semibold outline-none placeholder:text-[var(--muted)]" /></div>
      <label className="field-label" htmlFor="movement-category">Categoría</label>
      <Select id="movement-category" required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="native-select mb-4"><option value="">Elige una categoría</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
      <label className="field-label" htmlFor="movement-description">Descripción</label>
      <input id="movement-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={160} placeholder="¿En qué ha sido? (opcional)" className="control mb-4 placeholder:text-[var(--muted)]" />
      <label className="field-label" htmlFor="movement-date">Fecha</label>
      <input id="movement-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="control mb-4" />
      {error && <p className="mb-3 text-sm text-[var(--expense)]" role="alert">{error}</p>}
      <Button disabled={pending} type="submit" className="w-full">{pending ? "Guardando…" : transaction ? "Guardar cambios" : "Guardar movimiento"}</Button>
    </form>
  </dialog>;
}
