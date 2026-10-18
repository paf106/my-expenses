"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";
import type { Category, TransactionType } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { parseAmountEs } from "@/lib/utils";
import { useSheetDismiss } from "@/components/ui/use-sheet-dismiss";
import { Button, Card, CardHeader } from "@/components/ui/primitives";
import { PageHeading } from "@/components/ui/page-heading";
import { CategoryDesktopRow } from "@/components/categories/category-desktop-row";
import { CategoryMobileCard } from "@/components/categories/category-mobile-card";
import { CategoryIconPicker } from "@/components/ui/category-icon-picker";
import { usePwa } from "@/components/pwa-provider";

const colors = ["#7187c9", "#df8559", "#8171c8", "#cb7ca2", "#5ca79a", "#bd8f54", "#8993a4", "#1f9d74"];
const colorNames: Record<string, string> = { "#7187c9": "Azul", "#df8559": "Naranja", "#8171c8": "Violeta", "#cb7ca2": "Rosa", "#5ca79a": "Verde agua", "#bd8f54": "Ocre", "#8993a4": "Gris", "#1f9d74": "Verde" };

export function CategoriesView({ categories }: { categories: Category[] }) {
  const [items, setItems] = useState(categories);
  const [pending, startTransition] = useTransition();
  const { online } = usePwa();
  const [error, setError] = useState("");
  const [draftErrorField, setDraftErrorField] = useState<"name" | "budget" | null>(null);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [newType, setNewType] = useState<TransactionType | null>(null);
  const [draft, setDraft] = useState<Category | null>(null);
  const [budgetDraft, setBudgetDraft] = useState("");
  const editorDialog = useRef<HTMLDialogElement>(null);
  const noticeTimer = useRef<number | null>(null);
  const savedItems = useRef(new Map(categories.map((category) => [category.id, category])));
  const router = useRouter();

  useEffect(() => {
    const element = editorDialog.current;
    const shouldOpen = Boolean((editing || newType) && draft);
    if (element && shouldOpen && !element.open) element.showModal();
    else if (element?.open && !shouldOpen) element.close();
  }, [editing, newType, draft]);
  useEffect(() => () => { if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current); }, []);
  const announceNotice = (message: string) => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => { setNotice(""); noticeTimer.current = null; }, 2200);
  };

  const persist = (id: string, field: "name" | "monthly_budget", value: string) => startTransition(async () => {
    setError("");
    const item = savedItems.current.get(id);
    if (!item) return;
    if (!online) { setError("Conéctate a internet para guardar los cambios."); if (field === "name") setItems((current) => current.map((category) => category.id === id ? { ...category, name: item.name } : category)); return; }
    const trimmed = value.trim();
    if (field === "name" && !trimmed) { setItems((current) => current.map((category) => category.id === id ? { ...category, name: item.name } : category)); return; }
    const budget = field === "monthly_budget" ? (value.trim() === "" ? null : parseAmountEs(value)) : item.monthly_budget;
    if (field === "monthly_budget" && value.trim() !== "" && (budget === null || budget < 0)) { setError("El límite debe ser cero o un importe positivo con hasta dos decimales."); return; }
    if ((field === "name" && trimmed === item.name) || (field === "monthly_budget" && budget === item.monthly_budget)) return;
    const update = field === "name" ? { name: trimmed } : { monthly_budget: budget };
    const { error: saveError } = await createClient().from("categories").update(update).eq("id", id);
    if (saveError) { setError(`No se ha podido guardar «${item.name}».`); setItems((current) => current.map((category) => category.id === id ? { ...category, [field]: field === "name" ? item.name : item.monthly_budget } : category)); }
    else { savedItems.current.set(id, { ...item, [field]: field === "name" ? trimmed : budget }); setItems((current) => current.map((category) => category.id === id ? { ...category, [field]: field === "name" ? trimmed : budget } : category)); announceNotice("Cambios guardados"); router.refresh(); }
  });
  const update = (id: string, field: "name" | "monthly_budget" | "color" | "icon", value: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: field === "monthly_budget" ? (value === "" ? null : Number(value)) : value } : item));
  const setColor = (item: Category, color: string) => startTransition(async () => {
    if (!online) { setError("Conéctate a internet para cambiar el color."); return; }
    update(item.id, "color", color);
    const { error: saveError } = await createClient().from("categories").update({ color }).eq("id", item.id);
    if (saveError) { update(item.id, "color", item.color); setError(`No se ha podido guardar el color de «${item.name}».`); }
    else { savedItems.current.set(item.id, { ...item, color }); router.refresh(); }
  });
  const setIcon = (item: Category, icon: string) => startTransition(async () => {
    if (!online) { setError("Conéctate a internet para cambiar el icono."); return; }
    update(item.id, "icon", icon);
    const { error: saveError } = await createClient().from("categories").update({ icon }).eq("id", item.id);
    if (saveError) { update(item.id, "icon", item.icon); setError(`No se ha podido guardar el icono de «${item.name}».`); }
    else { savedItems.current.set(item.id, { ...item, icon }); router.refresh(); }
  });
  const remove = (item: Category) => {
    if (!online) { setError("Conéctate a internet para eliminar la categoría."); return; }
    if (!window.confirm(`¿Eliminar la categoría «${item.name}»? Los movimientos guardados se conservarán sin categoría.`)) return;
    startTransition(async () => {
      const { error: deleteError } = await createClient().from("categories").delete().eq("id", item.id);
      if (deleteError) setError("No se ha podido eliminar la categoría.");
      else { savedItems.current.delete(item.id); setItems((current) => current.filter((category) => category.id !== item.id)); announceNotice("Categoría eliminada"); router.refresh(); }
    });
  };
  const startAdd = (type: TransactionType) => {
    setNewType(type);
    setEditing(null);
    setBudgetDraft("");
    setDraft({ id: "", user_id: "", name: "", type, icon: type === "expense" ? "circle-ellipsis" : "circle-plus", color: colors[items.length % colors.length], monthly_budget: null, archived: false, created_at: "" });
  };
  const startEdit = (item: Category) => { setEditing(item); setNewType(null); setDraft({ ...item }); setBudgetDraft(item.monthly_budget === null ? "" : String(item.monthly_budget).replace(".", ",")); };
  const finishCloseEditor = useCallback(() => { setEditing(null); setNewType(null); setDraft(null); setBudgetDraft(""); setDraftErrorField(null); setError(""); }, []);
  const { closing: editorClosing, dismiss: dismissEditor } = useSheetDismiss(finishCloseEditor);
  const closeEditor = useCallback((force = false) => { if (pending && !force) return; dismissEditor(); }, [pending, dismissEditor]);
  const saveMobile = () => {
    if (!online) { setError("Conéctate a internet para guardar los cambios."); return; }
    if (!draft || !draft.name.trim()) { setDraftErrorField("name"); setError("Escribe un nombre para la categoría."); document.getElementById("category-name")?.focus(); return; }
    const budget = budgetDraft.trim() ? parseAmountEs(budgetDraft) : null;
    if (budgetDraft.trim() && (budget === null || budget < 0)) { setDraftErrorField("budget"); setError("El límite debe ser cero o un importe positivo con hasta dos decimales."); document.getElementById("category-budget")?.focus(); return; }
    startTransition(async () => {
      setError("");
      setDraftErrorField(null);
      const supabase = createClient();
      if (newType) {
        const { data, error: saveError } = await supabase.from("categories").insert({ type: newType, name: draft.name.trim(), icon: draft.icon, color: draft.color, monthly_budget: newType === "expense" ? budget : null, archived: false }).select().single();
        if (saveError || !data) { setError(saveError?.code === "23505" ? "Ya existe una categoría con ese nombre." : "No se pudo añadir la categoría. Comprueba la conexión e inténtalo de nuevo."); return; }
        savedItems.current.set(data.id, data);
        setItems((current) => [...current, data]); announceNotice("Categoría añadida");
      } else if (editing) {
        const { error: saveError } = await supabase.from("categories").update({ name: draft.name.trim(), icon: draft.icon, color: draft.color, monthly_budget: draft.type === "expense" ? budget : null }).eq("id", editing.id);
        if (saveError) { setError(`No se ha podido guardar «${editing.name}».`); return; }
        savedItems.current.set(editing.id, { ...draft, name: draft.name.trim(), monthly_budget: draft.type === "expense" ? budget : null });
        setItems((current) => current.map((item) => item.id === editing.id ? { ...item, ...draft, name: draft.name.trim(), monthly_budget: draft.type === "expense" ? budget : null } : item)); announceNotice("Categoría guardada");
      }
      closeEditor(true); router.refresh();
    });
  };
  const removeMobile = () => {
    if (!editing) return;
    if (!online) { setError("Conéctate a internet para eliminar la categoría."); return; }
    if (!window.confirm(`¿Eliminar «${editing.name}»? Los movimientos se conservarán sin categoría.`)) return;
    startTransition(async () => {
      const { error: deleteError } = await createClient().from("categories").delete().eq("id", editing.id);
      if (deleteError) { setError(`No se ha podido eliminar «${editing.name}».`); return; }
       savedItems.current.delete(editing.id); setItems((current) => current.filter((item) => item.id !== editing.id)); announceNotice("Categoría eliminada"); closeEditor(true); router.refresh();
    });
  };

  return <div className="motion-enter max-w-4xl space-y-4">
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{notice || (pending ? "Guardando cambios…" : "")}</div>
    <PageHeading description="Organiza tus categorías y define un límite mensual para cada gasto." backHref="/settings" />
    {(["expense", "income"] as const).map((type) => <Card key={type} className="hidden p-4 md:block md:p-6">
      <CardHeader title={type === "expense" ? "Gastos" : "Ingresos"} action={<Button type="button" variant="quiet" className="px-3" onClick={() => startAdd(type)}><Plus size={16}/>Añadir</Button>} />
      <div className="motion-list space-y-3">{items.filter((item) => item.type === type).map((item) => <CategoryDesktopRow key={item.id} item={item} type={type} colors={colors} disabled={pending || !online} onUpdate={update} onPersist={persist} onColor={setColor} onIcon={setIcon} onRemove={remove}/>)}</div>
    </Card>)}
    {(["expense", "income"] as const).map((type) => <section key={`mobile-${type}`} className="space-y-2 md:hidden">
      <div className="flex items-center justify-between px-1"><h2 className="m-0 text-base font-semibold">{type === "expense" ? "Gastos" : "Ingresos"}</h2><Button type="button" variant="quiet" className="px-3" onClick={() => startAdd(type)}><Plus size={16}/>Añadir</Button></div>
      <div className="motion-list space-y-2">{items.filter((item) => item.type === type).map((item) => <CategoryMobileCard key={item.id} item={item} type={type} onSelect={startEdit}/>)}</div>
    </section>)}
    {(editing || newType) && draft && <dialog ref={editorDialog} aria-labelledby="category-editor-title" className={`category-editor-dialog max-h-[86dvh] overflow-y-auto text-[var(--ink)] shadow-2xl${editorClosing ? " is-closing" : ""}`} onCancel={(event) => { event.preventDefault(); if (!pending) closeEditor(); }} onClick={(event) => { if (event.target === editorDialog.current) { const dirty = newType ? Boolean(draft.name || budgetDraft) : Boolean(editing && (draft.name !== editing.name || draft.icon !== editing.icon || draft.color !== editing.color || budgetDraft !== (editing.monthly_budget === null ? "" : String(editing.monthly_budget).replace(".", ",")))); if (!dirty || window.confirm("¿Descartar los cambios de la categoría?")) closeEditor(); } }}>
        <div className="mb-5 flex items-center justify-between"><h2 id="category-editor-title" className="m-0 text-lg font-semibold">{newType ? "Nueva categoría" : "Editar categoría"}</h2><button type="button" aria-label="Cerrar" disabled={pending} onClick={() => closeEditor()} className="icon-button text-[var(--muted)] hover:bg-[var(--soft-blue)]"><X size={18}/></button></div>
        <label htmlFor="category-name" className="field-label">Nombre<input id="category-name" autoFocus disabled={editorClosing || pending} maxLength={48} value={draft.name} aria-invalid={draftErrorField === "name" || undefined} aria-describedby={draftErrorField === "name" ? "category-form-error" : undefined} onChange={(event) => { setDraft({ ...draft, name: event.target.value }); setDraftErrorField(null); }} className="control" /></label>
        {draft.type === "expense" && <label htmlFor="category-budget" className="field-label mt-4">Límite mensual<input id="category-budget" type="text" inputMode="decimal" disabled={pending} value={budgetDraft} aria-invalid={draftErrorField === "budget" || undefined} aria-describedby={draftErrorField === "budget" ? "category-form-error" : undefined} onChange={(event) => { setBudgetDraft(event.target.value); setDraftErrorField(null); }} placeholder="Sin límite" className="control" /></label>}
        <div className="mt-4"><span id="category-color-label" className="field-label">Color</span><div role="group" aria-labelledby="category-color-label" className="flex flex-wrap gap-1">{colors.map((color) => <button key={color} type="button" disabled={pending} aria-label={`Color ${colorNames[color]}`} aria-pressed={draft.color === color} onClick={() => setDraft({ ...draft, color })} className={`flex h-11 w-11 items-center justify-center rounded-xl ${draft.color === color ? "bg-[var(--soft-blue)]" : ""}`}><span aria-hidden="true" className="h-7 w-7 rounded-full border-2 border-[var(--surface)] shadow-[0_0_0_1px_var(--line)]" style={{ background: color }}>{draft.color === color && <Check className="m-auto h-full w-full p-1 text-white" />}</span></button>)}</div></div>
        <div className="mt-4"><span id="category-icon-label" className="field-label">Icono</span><CategoryIconPicker value={draft.icon} disabled={pending} onChange={(icon) => setDraft({ ...draft, icon })} mobileSheet={false} className="w-full" /></div>
        {error && <p id={draftErrorField ? "category-form-error" : undefined} className="mt-3 text-sm text-[var(--expense)]" role="alert">{error}</p>}
        <Button type="button" disabled={pending || !online} onClick={saveMobile} className="mt-5 w-full">{pending ? "Guardando…" : "Guardar"}</Button>
        {editing && <Button type="button" variant="danger" disabled={pending || !online} onClick={removeMobile} className="mt-2 w-full">Eliminar categoría</Button>}
      </dialog>}
    {error && !(editing || newType) && <p className="rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--expense)]" role="alert">{error}</p>}
    {notice && <p aria-hidden="true" className="text-sm font-medium text-[var(--income)]">{notice}</p>}
    {pending && <p aria-hidden="true" className="muted text-xs">Guardando…</p>}
  </div>;
}
