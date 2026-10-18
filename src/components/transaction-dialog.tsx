"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, TransactionType } from "@/lib/supabase/types";
import { X } from "lucide-react";
import type { MonthTransaction } from "@/lib/supabase/types";
import { localToday, parseAmountEs } from "@/lib/utils";
import { Button, Select } from "@/components/ui/primitives";
import { useSheetDismiss } from "@/components/ui/use-sheet-dismiss";
import { DateField } from "@/components/ui/date-field";
import { SegmentedControl } from "@/components/ui/segmented-control";

const typeOptions = [{ id: "expense", label: "Gasto" }, { id: "income", label: "Ingreso" }];

export function TransactionDialog({ open, transaction, categories, defaultType = "expense", offline = false, onClose, onSaved }: { open: boolean; transaction?: MonthTransaction | null; categories: Category[]; defaultType?: TransactionType; offline?: boolean; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<TransactionType>(transaction?.type || defaultType);
  const [amount, setAmount] = useState(transaction ? String(transaction.amount).replace(".", ",") : "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id || "");
  const [date, setDate] = useState(transaction?.date || localToday());
  const [error, setError] = useState("");
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [pending, startTransition] = useTransition();
  const { closing, dismiss } = useSheetDismiss(onClose);
  useEffect(() => { const element = dialog.current; if (!element) return; if (open && !element.open) element.showModal(); if (!open && element.open) element.close(); }, [open]);
  const options = categories.filter((category) => !category.archived && category.type === type);
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
    if (offline) { setError("Necesitas conexión para guardar movimientos."); return; }
    const numericAmount = parseAmountEs(amount);
    if (numericAmount === null || numericAmount <= 0) { setAmountInvalid(true); setError("Escribe un importe válido, como 12,50 €."); dialog.current?.querySelector<HTMLInputElement>("#movement-amount")?.focus(); return; }
    setAmountInvalid(false);
    startTransition(async () => {
      const supabase = createClient();
      const values = { type, amount: numericAmount, description: description.trim(), category_id: categoryId || null, date };
      const { error: saveError } = transaction ? await supabase.from("transactions").update(values).eq("id", transaction.id) : await supabase.from("transactions").insert(values);
       if (saveError) { setError(saveError.message.includes("Failed to fetch") ? "No se pudo conectar. Comprueba tu conexión y vuelve a intentarlo." : "No se pudo guardar el movimiento. Revisa tu conexión y vuelve a intentarlo."); return; }
      setAmount(""); setDescription(""); setCategoryId(""); close(onSaved, true);
    });
  };
  return <dialog ref={dialog} aria-labelledby="transaction-dialog-title" className={`dialog-sheet${closing ? " is-closing" : ""}`} onCancel={(event) => { event.preventDefault(); close(onClose); }} onClick={(event) => { if (event.target === dialog.current) { const dirty = amount !== (transaction ? String(transaction.amount).replace(".", ",") : "") || description !== (transaction?.description || "") || categoryId !== (transaction?.category_id || "") || date !== (transaction?.date || localToday()) || type !== (transaction?.type || defaultType); if (!dirty || window.confirm("¿Descartar los cambios de este movimiento?")) close(onClose); } }}>
    <form onSubmit={submit} className="max-h-[90dvh] overflow-y-auto p-5 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-[max(env(safe-area-inset-bottom),24px)] sm:p-7 sm:pl-7 sm:pr-7">
      <div className="mb-5 flex items-center justify-between"><div><h2 id="transaction-dialog-title" className="m-0 text-xl font-semibold">{transaction ? "Editar movimiento" : "Nuevo movimiento"}</h2></div><button type="button" onClick={() => close(onClose)} aria-label="Cerrar" className="icon-button text-[var(--muted)] hover:bg-[var(--soft-blue)]"><X size={19} /></button></div>
      <SegmentedControl options={typeOptions} value={type} label="Tipo de movimiento" onChange={(value) => { setType(value as TransactionType); setCategoryId(""); }} className="mb-5" />
      <label className="field-label" htmlFor="movement-amount">Importe</label>
       <div className="mb-5 flex items-center gap-2 rounded-xl border border-[var(--control-line)] bg-[var(--surface)] px-3 focus-within:border-[var(--focus)] focus-within:ring-2 focus-within:ring-[var(--focus)]"><span aria-hidden="true" className="muted text-2xl">€</span><input id="movement-amount" name="amount" required type="text" inputMode="decimal" autoFocus value={amount} onChange={(event) => { setAmount(event.target.value); setAmountInvalid(false); }} aria-invalid={amountInvalid || undefined} aria-describedby={amountInvalid ? "movement-error" : undefined} placeholder="0,00" className="amount min-h-[72px] w-full bg-transparent text-[36px] font-semibold outline-none placeholder:text-[var(--muted)]" /></div>
       <label className="field-label" htmlFor="movement-category">Categoría</label>
       <Select id="movement-category" name="category" required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="native-select mb-4"><option value="">Elige una categoría</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
      <label className="field-label" htmlFor="movement-description">Descripción</label>
       <input id="movement-description" name="description" autoComplete="off" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={160} placeholder="¿En qué ha sido? (opcional)" className="control mb-4 placeholder:text-[var(--muted)]" />
      <label className="field-label" htmlFor="movement-date">Fecha</label>
        <DateField id="movement-date" name="date" required value={date} onChange={setDate} className="mb-4" />
       {error && <p id="movement-error" className="mb-3 text-sm text-[var(--expense)]" role="alert">{error}</p>}
       <Button disabled={pending || offline} type="submit" className="w-full">{offline ? "Sin conexión" : pending ? "Guardando…" : transaction ? "Guardar cambios" : "Guardar movimiento"}</Button>
    </form>
  </dialog>;
}
