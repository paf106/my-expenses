"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Category, MonthTransaction, TransactionType } from "@/lib/supabase/types";
import { localToday, parseAmountEs } from "@/lib/utils";
import { getRecentCategorySnapshot, rememberRecentCategory, subscribeRecentCategories } from "@/lib/recent-categories";
import { Button } from "@/components/ui/primitives";
import { useSheetDismiss } from "@/components/ui/use-sheet-dismiss";
import { DateField } from "@/components/ui/date-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CategoryPicker } from "@/components/ui/category-picker";

const typeOptions = [{ id: "expense", label: "Gasto" }, { id: "income", label: "Ingreso" }];
export type SavedMovement = { current: MonthTransaction; previous: MonthTransaction | null };
const previousDay = (date: string) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
};

export function TransactionDialog({ open, transaction, categories, defaultType = "expense", offline = false, onClose, onSaved }: { open: boolean; transaction?: MonthTransaction | null; categories: Category[]; defaultType?: TransactionType; offline?: boolean; onClose: () => void; onSaved: (saved: SavedMovement) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const amountInput = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<TransactionType>(transaction?.type || defaultType);
  const [amount, setAmount] = useState(transaction ? String(transaction.amount).replace(".", ",") : "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [categoryChoice, setCategoryChoice] = useState<string | null>(() => transaction ? transaction.category_id || "" : null);
  const [date, setDate] = useState(transaction?.date || localToday());
  const [showCustomDate, setShowCustomDate] = useState(() => {
    if (!transaction) return false;
    const today = localToday();
    return transaction.date !== today && transaction.date !== previousDay(today);
  });
  const [discardConfirmation, setDiscardConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [pending, startTransition] = useTransition();
  const recentSnapshot = useSyncExternalStore(subscribeRecentCategories, getRecentCategorySnapshot, () => "[]");
  const recentIds = JSON.parse(recentSnapshot) as string[];
  const { closing, dismiss } = useSheetDismiss(onClose);
  const today = localToday();
  const yesterday = previousDay(today);
  const options = categories.filter((category) => !category.archived && category.type === type);
  const recentCategories = recentIds.map((id) => options.find((category) => category.id === id)).filter((category): category is Category => Boolean(category));
  const suggestedCategories = recentCategories.length ? recentCategories : options.slice(0, 3);
  const categoryId = categoryChoice ?? recentCategories[0]?.id ?? options[0]?.id ?? "";
  const initialType = transaction?.type || defaultType;
  const initialAmount = transaction ? String(transaction.amount).replace(".", ",") : "";
  const initialDescription = transaction?.description || "";
  const initialDate = transaction?.date || today;
  const initialCategoryId = transaction ? transaction.category_id || "" : recentCategories[0]?.id ?? options[0]?.id ?? "";
  const hasChanges = type !== initialType || amount !== initialAmount || description !== initialDescription || date !== initialDate || categoryId !== initialCategoryId;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      if (!transaction && window.matchMedia("(pointer: fine)").matches) requestAnimationFrame(() => amountInput.current?.focus());
    } else if (!open && element.open) element.close();
  }, [open, transaction]);

  useEffect(() => {
    const element = dialog.current;
    const viewport = window.visualViewport;
    if (!open || !element || !viewport) return;
    const updateForKeyboard = () => {
      const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      element.style.setProperty("--dialog-available-height", `${viewport.height}px`);
      element.style.setProperty("--dialog-keyboard-inset", `${keyboardInset}px`);
    };
    updateForKeyboard();
    viewport.addEventListener("resize", updateForKeyboard);
    viewport.addEventListener("scroll", updateForKeyboard);
    return () => {
      viewport.removeEventListener("resize", updateForKeyboard);
      viewport.removeEventListener("scroll", updateForKeyboard);
      element.style.removeProperty("--dialog-available-height");
      element.style.removeProperty("--dialog-keyboard-inset");
    };
  }, [open]);

  const close = (callback: () => void, force = false) => {
    if (pending && !force) return;
    setDiscardConfirmation(false);
    dismiss(() => {
      const element = dialog.current;
      if (element?.open) element.close();
      callback();
    });
  };
  const requestClose = () => {
    if (pending) return;
    if (hasChanges) { setDiscardConfirmation(true); return; }
    close(onClose);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (offline) { setError("Necesitas conexión para guardar movimientos."); return; }
    const numericAmount = parseAmountEs(amount);
    if (numericAmount === null || numericAmount <= 0) {
      setAmountInvalid(true);
      setError("Escribe un importe válido, como 12,50 €.");
      amountInput.current?.focus();
      return;
    }
    setAmountInvalid(false);
    startTransition(async () => {
      const supabase = createClient();
      const values = { type, amount: numericAmount, description: description.trim(), category_id: categoryId || null, date };
      const { data, error: saveError } = transaction
        ? await supabase.from("transactions").update(values).eq("id", transaction.id).select("id,category_id,recurring_id,type,amount,description,date").single()
        : await supabase.from("transactions").insert(values).select("id,category_id,recurring_id,type,amount,description,date").single();
      if (saveError) {
        setError(saveError.message.includes("Failed to fetch") ? "No se pudo conectar. Comprueba tu conexión y vuelve a intentarlo." : "No se pudo guardar el movimiento. Revisa tu conexión y vuelve a intentarlo.");
        return;
      }
      if (categoryId) rememberRecentCategory(categoryId);
      setAmount("");
      setDescription("");
      close(() => onSaved({ current: data, previous: transaction || null }), true);
    });
  };

  return <dialog
    ref={dialog}
    aria-labelledby="transaction-dialog-title"
    className={`dialog-sheet${closing ? " is-closing" : ""}`}
    onCancel={(event) => { event.preventDefault(); requestClose(); }}
    onClick={(event) => { if (event.target === dialog.current) requestClose(); }}
  >
    <form onSubmit={submit} className="flex max-h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 pb-4 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="transaction-dialog-title" className="m-0 text-xl font-semibold">{transaction ? "Editar movimiento" : "Nuevo movimiento"}</h2>
          <button type="button" onClick={requestClose} aria-label="Cerrar" className="icon-button shrink-0 text-[var(--muted)] hover:bg-[var(--soft-blue)]"><X size={19} /></button>
        </div>
        {discardConfirmation && <div className="mb-5 rounded-xl bg-[var(--danger-soft)] p-3" role="group" aria-labelledby="discard-movement-title" aria-live="polite">
          <p id="discard-movement-title" className="m-0 text-sm font-semibold">¿Descartar los cambios?</p>
          <div className="mt-3 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setDiscardConfirmation(false)}>Seguir editando</Button><Button type="button" variant="danger" onClick={() => close(onClose, true)}>Descartar</Button></div>
        </div>}
        <SegmentedControl options={typeOptions} value={type} label="Tipo de movimiento" onChange={(value) => { setType(value as TransactionType); setCategoryChoice(null); }} className="mb-5" />
        <label className="field-label" htmlFor="movement-amount">Importe</label>
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-[var(--control-line)] bg-[var(--surface)] px-3 focus-within:border-[var(--focus)] focus-within:ring-2 focus-within:ring-[var(--focus)]">
          <span aria-hidden="true" className="muted text-2xl">€</span>
          <input ref={amountInput} id="movement-amount" name="amount" disabled={pending} required type="text" inputMode="decimal" enterKeyHint="next" value={amount} onChange={(event) => { setAmount(event.target.value); setAmountInvalid(false); }} aria-invalid={amountInvalid || undefined} aria-describedby={amountInvalid ? "movement-error" : undefined} placeholder="0,00" className="amount min-h-[72px] w-full bg-transparent text-[36px] font-semibold outline-none placeholder:text-[var(--muted)]" />
        </div>
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="field-label mb-0">{recentCategories.length ? "Recientes" : "Categorías"}</span>
            <CategoryPicker categories={options} value={categoryId || "all"} allLabel="Sin categoría" label="Más categorías" triggerText="Más" compact mobileSheet portalToDialog onChange={(value) => setCategoryChoice(value === "all" ? "" : value)} />
          </div>
          {suggestedCategories.length ? <div role="group" aria-label={recentCategories.length ? "Categorías recientes" : "Categorías"} className="grid grid-cols-2 gap-2">
            {suggestedCategories.map((item) => <button key={item.id} type="button" disabled={pending} aria-pressed={categoryId === item.id} onClick={() => setCategoryChoice(item.id)} className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-3 text-left text-sm ${categoryId === item.id ? "border-[var(--focus)] bg-[var(--soft-blue)] font-semibold" : "border-[var(--line)] bg-[var(--surface)]"}`}>
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ color: item.color, backgroundColor: `color-mix(in srgb, ${item.color} 14%, transparent)` }}><CategoryIcon name={item.icon} size={16}/></span>
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {categoryId === item.id && <Check aria-hidden="true" size={15} className="shrink-0 text-[var(--accent)]"/>}
            </button>)}
          </div> : <p className="muted m-0 rounded-xl bg-[var(--soft-blue)] p-3 text-sm">No hay categorías para este tipo. Puedes guardar el movimiento sin categoría o crear una en Ajustes.</p>}
          {!categoryId && <p className="muted mb-0 mt-2 text-xs">Se guardará sin categoría.</p>}
        </div>
        <label className="field-label" htmlFor="movement-description">Descripción</label>
        <input id="movement-description" name="description" disabled={pending} autoComplete="off" enterKeyHint="done" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={160} placeholder="¿En qué ha sido? (opcional)" className="control mb-5 placeholder:text-[var(--muted)]" />
        <span id="movement-date-label" className="field-label mb-2">Fecha</span>
        <div role="group" aria-labelledby="movement-date-label" className="mb-3 grid grid-cols-3 gap-2">
          <button type="button" disabled={pending} aria-pressed={date === today} onClick={() => { setDate(today); setShowCustomDate(false); }} className={`min-h-11 rounded-xl border text-sm font-medium ${date === today ? "border-[var(--focus)] bg-[var(--soft-blue)]" : "border-[var(--line)] bg-[var(--surface)]"}`}>Hoy</button>
          <button type="button" disabled={pending} aria-pressed={date === yesterday} onClick={() => { setDate(yesterday); setShowCustomDate(false); }} className={`min-h-11 rounded-xl border text-sm font-medium ${date === yesterday ? "border-[var(--focus)] bg-[var(--soft-blue)]" : "border-[var(--line)] bg-[var(--surface)]"}`}>Ayer</button>
          <button type="button" disabled={pending} aria-pressed={showCustomDate} onClick={() => setShowCustomDate(true)} className={`min-h-11 rounded-xl border text-sm font-medium ${showCustomDate ? "border-[var(--focus)] bg-[var(--soft-blue)]" : "border-[var(--line)] bg-[var(--surface)]"}`}>Otra fecha</button>
        </div>
        {showCustomDate && <div><label htmlFor="movement-date" className="field-label">Otra fecha</label><DateField id="movement-date" name="date" required value={date} onChange={setDate} className="mb-4" /></div>}
        {error && <p id={amountInvalid ? "movement-error" : undefined} className="mb-3 text-sm text-[var(--expense)]" role="alert">{error}</p>}
      </div>
      <footer className="shrink-0 border-t border-[var(--line)] bg-[var(--surface)] p-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(env(safe-area-inset-bottom),16px)] sm:px-7">
        {offline && <p className="muted mb-2 text-center text-xs" role="status">Conéctate a internet para guardar este movimiento.</p>}
        <Button disabled={pending || offline} type="submit" className="w-full">{offline ? "Sin conexión" : pending ? "Guardando…" : transaction ? "Guardar cambios" : "Guardar movimiento"}</Button>
      </footer>
    </form>
  </dialog>;
}
