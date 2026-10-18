"use client";

import { useRef, useState, useTransition } from "react";
import { CalendarClock, Check, Pencil, Plus, Repeat2, Trash2, X } from "lucide-react";
import type { Category, RecurringTransaction, TransactionType, Frequency } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { euro, formatDate } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Button, Card, Field, Select } from "@/components/ui/primitives";
import { PageHeading } from "@/components/ui/page-heading";
import { DateField } from "@/components/ui/date-field";
import { parseAmountEs } from "@/lib/utils";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { usePwa } from "@/components/pwa-provider";

const typeOptions = [{ id: "expense", label: "Gasto" }, { id: "income", label: "Ingreso" }];
const frequencyOptions: Record<Frequency, string> = { weekly: "Cada semana", monthly: "Cada mes", yearly: "Cada año" };

export function RecurringView({ recurring, categories, today }: { recurring: RecurringTransaction[]; categories: Category[]; today: string }) {
  const { online } = usePwa();
  const formRef = useRef<HTMLFormElement>(null);
  const [rows, setRows] = useState(recurring);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [nextRun, setNextRun] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const activeCount = rows.filter((row) => row.active).length;
  const editing = rows.find((row) => row.id === editingId) || null;

  const resetForm = () => {
    setEditingId(null);
    setType("expense");
    setAmount("");
    setAmountInvalid(false);
    setDescription("");
    setCategoryId("");
    setFrequency("monthly");
    setNextRun(today);
    setEndDate("");
    setError("");
  };

  const openNewForm = () => {
    resetForm();
    setNotice("");
    setFormOpen(true);
    window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("#recurring-amount")?.focus({ preventScroll: true }));
  };

  const openEditForm = (row: RecurringTransaction) => {
    setEditingId(row.id);
    setType(row.type);
    setAmount(String(row.amount).replace(".", ","));
    setAmountInvalid(false);
    setDescription(row.description || "");
    setCategoryId(row.category_id || "");
    setFrequency(row.frequency);
    setNextRun(row.next_run);
    setEndDate(row.end_date || "");
    setError("");
    setNotice("");
    setFormOpen(true);
    window.requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!online) { setError("Conéctate a internet para guardar cambios."); return; }
    const numericAmount = parseAmountEs(amount);
    if (numericAmount === null || numericAmount <= 0) {
      setAmountInvalid(true);
      setError("Introduce un importe válido, como 12,50 €.");
      document.getElementById("recurring-amount")?.focus();
      return;
    }
    setAmountInvalid(false);
    if (endDate && endDate < nextRun) {
      setError("La fecha de fin debe ser igual o posterior a la próxima fecha.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const values = { type, amount: numericAmount, description: description.trim(), category_id: categoryId || null, frequency, next_run: nextRun, end_date: endDate || null, active: editing?.active ?? true };
      const scheduleChanged = Boolean(editing && (editing.next_run !== nextRun || editing.frequency !== frequency));
      const result = editing
        ? await supabase.from("recurring_transactions").update({ ...values, ...(scheduleChanged ? { anchor_date: nextRun } : {}) }).eq("id", editing.id).select().single()
        : await supabase.from("recurring_transactions").insert({ ...values, anchor_date: nextRun }).select().single();
      if (result.error) {
        setError(result.error.message.includes("Failed to fetch") ? "No se pudo conectar. Comprueba tu conexión y vuelve a intentarlo." : "No se pudo guardar el recurrente. Comprueba las fechas y vuelve a intentarlo.");
        return;
      }
      setRows((current) => editing ? current.map((row) => row.id === editing.id ? result.data : row) : [...current, result.data].toSorted((a, b) => a.next_run.localeCompare(b.next_run)));
      setNotice(editing ? "Cambios guardados." : "Recurrente creado.");
      resetForm();
      setFormOpen(false);
    });
  };

  const toggle = (row: RecurringTransaction) => startTransition(async () => {
    setError("");
    const { data, error: updateError } = await createClient().from("recurring_transactions").update({ active: !row.active }).eq("id", row.id).select("active,next_run").single();
    if (updateError) { setError("No se pudo cambiar el estado del movimiento. Comprueba la conexión e inténtalo de nuevo."); return; }
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, active: data.active, next_run: data.next_run } : item));
  });

  const remove = (row: RecurringTransaction) => startTransition(async () => {
    setError("");
    const { error: deleteError } = await createClient().from("recurring_transactions").delete().eq("id", row.id);
    if (deleteError) { setError("No se pudo eliminar el movimiento recurrente. Comprueba la conexión e inténtalo de nuevo."); return; }
    setRows((current) => current.filter((item) => item.id !== row.id));
    setConfirmDeleteId(null);
    if (editingId === row.id) { resetForm(); setFormOpen(false); }
    setNotice("Recurrente eliminado.");
  });

  return <div className="motion-enter max-w-5xl">
    <PageHeading description="Programa cargos e ingresos que se repiten y consulta la próxima fecha." backHref="/settings"/>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--soft-blue)] p-4">
      <div className="min-w-0"><p className="m-0 text-sm font-semibold">{activeCount} {activeCount === 1 ? "movimiento activo" : "movimientos activos"}</p><p className="muted mb-0 mt-1 text-xs">Los desactivados no volverán a registrarse.</p></div>
      <Button type="button" onClick={openNewForm}><Plus size={16}/>Añadir recurrente</Button>
    </div>
    {notice && <p className="mb-4 rounded-xl bg-[color-mix(in_srgb,var(--income)_12%,var(--surface))] px-4 py-3 text-sm font-medium text-[var(--income)]" role="status">{notice}</p>}
    {error && !formOpen && <p className="mb-4 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--expense)]" role="alert">{error}</p>}

    {formOpen && <form ref={formRef} onSubmit={save} className="card mb-5 scroll-mt-4 space-y-4 p-5 md:p-6">
      <div className="flex items-start justify-between gap-3"><div><h2 className="m-0 text-base font-semibold">{editing ? "Editar recurrente" : "Nuevo recurrente"}</h2><p className="muted mb-0 mt-1 text-sm">{editing ? "Los cambios se aplicarán a las próximas repeticiones." : "Se registrará automáticamente en la próxima fecha."}</p></div><Button type="button" variant="quiet" aria-label="Cerrar formulario" onClick={() => { resetForm(); setFormOpen(false); }}><X size={18}/></Button></div>
      <SegmentedControl options={typeOptions} value={type} label="Tipo de movimiento recurrente" onChange={(value) => { setType(value as TransactionType); setCategoryId(""); }} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">Importe<Field id="recurring-amount" name="amount" required disabled={pending} inputMode="decimal" enterKeyHint="next" value={amount} aria-invalid={amountInvalid || undefined} aria-describedby={amountInvalid ? "recurring-error" : undefined} onChange={(event) => { setAmount(event.target.value); setAmountInvalid(false); }} placeholder="0,00 €" /></label>
        <label className="field-label">Descripción<Field name="description" disabled={pending} autoComplete="off" enterKeyHint="done" required value={description} onChange={(event) => setDescription(event.target.value)} maxLength={160} placeholder="Alquiler, suscripción…" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">Categoría<Select name="category" disabled={pending} className="native-select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Sin categoría</option>{categories.filter((category) => category.type === type).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></label>
        <label className="field-label">Frecuencia<Select name="frequency" disabled={pending} className="native-select" value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)}><option value="weekly">Cada semana</option><option value="monthly">Cada mes</option><option value="yearly">Cada año</option></Select></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">Próxima fecha<DateField name="next_run" required value={nextRun} onChange={setNextRun} /></label>
        <div><label className="field-label" htmlFor="recurring-end-date">Fecha de fin <span className="muted font-normal">(opcional)</span></label>{endDate ? <div className="flex items-start gap-2"><DateField id="recurring-end-date" name="end_date" value={endDate} onChange={setEndDate} className="min-w-0 flex-1"/><Button type="button" variant="secondary" aria-label="Quitar fecha de fin" onClick={() => setEndDate("")}><X size={16}/></Button></div> : <Button type="button" variant="secondary" className="w-full justify-start text-[var(--muted)]" onClick={() => setEndDate(nextRun)}><CalendarClock size={16}/>Sin fecha de fin</Button>}</div>
      </div>
      {error && <p id={amountInvalid ? "recurring-error" : undefined} className="m-0 text-sm text-[var(--expense)]" role="alert">{error}</p>}
      <div className="flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" disabled={pending} onClick={() => { resetForm(); setFormOpen(false); }}>Cancelar</Button>
        <Button disabled={pending || !online} type="submit"><Check size={16}/>{!online ? "Sin conexión" : pending ? "Guardando…" : editing ? "Guardar cambios" : "Guardar recurrente"}</Button>
      </div>
    </form>}

    {rows.length ? <section aria-label="Movimientos recurrentes" className="space-y-3">{rows.map((row) => {
      const category = categories.find((item) => item.id === row.category_id);
      const name = row.description || category?.name || "Movimiento";
      const isExpired = row.end_date !== null && row.end_date < today;
      return <article key={row.id} className="card p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={category ? { color: category.color, backgroundColor: `color-mix(in srgb, ${category.color} 14%, transparent)` } : { backgroundColor: "var(--soft-blue)" }}><CategoryIcon name={category?.icon} size={18}/></span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="min-w-0 break-words text-sm">{name}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${row.active ? "bg-[color-mix(in_srgb,var(--income)_12%,var(--surface))] text-[var(--income)]" : "bg-[var(--soft-blue)] text-[var(--muted)]"}`}>{row.active ? "Activo" : "Pausado"}</span></div><p className="muted mb-0 mt-1 text-xs">{category?.name || "Sin categoría"} · {frequencyOptions[row.frequency]}</p><p className="muted mb-0 mt-1 text-xs">{isExpired ? `Finalizó el ${formatDate(row.end_date!)}` : `Próximo cargo: ${formatDate(row.next_run)}`}{row.end_date ? ` · Hasta ${formatDate(row.end_date)}` : " · Sin fecha de fin"}</p></div>
          <strong className={`amount shrink-0 whitespace-nowrap text-sm font-semibold ${row.type === "income" ? "text-[var(--income)]" : ""}`}>{row.type === "income" ? "+" : "−"}{euro(row.amount)}</strong>
        </div>
        {confirmDeleteId === row.id ? <div className="mt-3 rounded-xl bg-[var(--danger-soft)] p-3" role="group" aria-label={`Confirmar eliminación de ${name}`}><p className="m-0 text-sm font-medium">¿Eliminar este recurrente?</p><div className="mt-2 flex justify-end gap-2"><Button type="button" variant="secondary" disabled={pending} onClick={() => setConfirmDeleteId(null)}>Cancelar</Button><Button type="button" variant="danger" disabled={pending || !online} onClick={() => remove(row)}>{pending ? "Eliminando…" : "Eliminar"}</Button></div></div> : <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
          <Button type="button" variant="secondary" disabled={pending || !online} onClick={() => openEditForm(row)}><Pencil size={15}/>Editar</Button>
          <Button type="button" variant="secondary" role="switch" aria-checked={row.active} aria-label={`${row.active ? "Pausar" : "Activar"} ${name}`} disabled={pending || !online} onClick={() => toggle(row)}><Repeat2 size={15}/>{row.active ? "Pausar" : "Activar"}</Button>
          <Button type="button" variant="quiet" disabled={pending || !online} onClick={() => setConfirmDeleteId(row.id)} aria-label={`Eliminar ${name}`} className="ml-auto text-[var(--expense)]"><Trash2 size={16}/>Eliminar</Button>
        </div>}
      </article>;
    })}</section> : <Card className="flex min-h-52 flex-col items-center justify-center p-6 text-center"><span aria-hidden="true" className="mb-3 rounded-2xl bg-[var(--soft-blue)] p-3"><Repeat2 size={21}/></span><h2 className="m-0 text-base font-semibold">Aún no tienes recurrentes</h2><p className="muted mb-4 mt-2 max-w-sm text-sm">Añade un pago o ingreso habitual y lo registraremos automáticamente por ti.</p><Button type="button" onClick={openNewForm}><Plus size={16}/>Añadir recurrente</Button></Card>}
  </div>;
}
