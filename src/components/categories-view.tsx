"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import type { Category, TransactionType } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CategoryIconPicker } from "@/components/ui/category-icon-picker";
import { ChevronRightIcon } from "@/components/ui/chevron-right-icon";
import { Button, Card, CardHeader } from "@/components/ui/primitives";
import { PageHeading } from "@/components/ui/page-heading";

const colors = ["#7187c9", "#df8559", "#8171c8", "#cb7ca2", "#5ca79a", "#bd8f54", "#8993a4", "#1f9d74"];

export function CategoriesView({ categories }: { categories: Category[] }) {
  const [items, setItems] = useState(categories);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [newType, setNewType] = useState<TransactionType | null>(null);
  const [draft, setDraft] = useState<Category | null>(null);
  const [editorClosing, setEditorClosing] = useState(false);
  const editorCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  useEffect(() => () => { if (editorCloseTimer.current) clearTimeout(editorCloseTimer.current); }, []);

  const persist = (id: string, field: "name" | "monthly_budget", value: string) => startTransition(async () => {
    setError("");
    const item = items.find((category) => category.id === id);
    if (!item) return;
    const update = field === "name" ? { name: value.trim() || item.name } : { monthly_budget: value === "" ? null : Number(value) };
    const { error: saveError } = await createClient().from("categories").update(update).eq("id", id);
    if (saveError) setError(`No se ha podido guardar «${item.name}».`);
    else { setNotice("Cambios guardados"); window.setTimeout(() => setNotice(""), 2200); router.refresh(); }
  });
  const update = (id: string, field: "name" | "monthly_budget" | "color" | "icon", value: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: field === "monthly_budget" ? (value === "" ? null : Number(value)) : value } : item));
  const add = (type: TransactionType) => startTransition(async () => {
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const defaultIcon = type === "expense" ? "circle-ellipsis" : "circle-plus";
    const { data, error: saveError } = await supabase.from("categories").insert({ user_id: user.id, name: type === "expense" ? "Nueva categoría" : "Nuevo ingreso", type, icon: defaultIcon, color: colors[items.length % colors.length], monthly_budget: null, archived: false }).select().single();
    if (saveError) setError("No se ha podido crear la categoría. Revisa que hayas aplicado la migración.");
    else if (data) { setItems((current) => [...current, data]); setNotice("Categoría añadida"); window.setTimeout(() => setNotice(""), 2200); }
  });
  const remove = (item: Category) => {
    if (!window.confirm(`¿Eliminar la categoría «${item.name}»? Los movimientos guardados se conservarán sin categoría.`)) return;
    startTransition(async () => {
      const { error: deleteError } = await createClient().from("categories").delete().eq("id", item.id);
      if (deleteError) setError("No se ha podido eliminar la categoría.");
      else { setItems((current) => current.filter((category) => category.id !== item.id)); setNotice("Categoría eliminada"); window.setTimeout(() => setNotice(""), 2200); router.refresh(); }
    });
  };
  const startAdd = (type: TransactionType) => {
    setNewType(type);
    setEditing(null);
    setDraft({ id: "", user_id: "", name: "", type, icon: type === "expense" ? "circle-ellipsis" : "circle-plus", color: colors[items.length % colors.length], monthly_budget: null, archived: false, created_at: "" });
  };
  const startEdit = (item: Category) => { setEditing(item); setNewType(null); setDraft({ ...item }); };
  const closeEditor = useCallback((force = false) => {
    if (editorClosing || (pending && !force)) return;
    setEditorClosing(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    editorCloseTimer.current = setTimeout(() => {
      setEditing(null); setNewType(null); setDraft(null); setError(""); setEditorClosing(false);
    }, reducedMotion ? 0 : 240);
  }, [editorClosing, pending]);
  useEffect(() => {
    if (!(editing || newType) || !draft) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) { event.preventDefault(); closeEditor(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, newType, draft, pending, closeEditor]);
  const saveMobile = () => {
    if (!draft || !draft.name.trim()) { setError("Escribe un nombre para la categoría."); return; }
    if (draft.monthly_budget !== null && (!Number.isFinite(Number(draft.monthly_budget)) || Number(draft.monthly_budget) < 0)) { setError("El límite debe ser cero o un importe positivo."); return; }
    startTransition(async () => {
      setError("");
      const supabase = createClient();
      if (newType) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Inicia sesión para añadir categorías."); return; }
        const { data, error: saveError } = await supabase.from("categories").insert({ user_id: user.id, type: newType, name: draft.name.trim(), icon: draft.icon, color: draft.color, monthly_budget: newType === "expense" ? draft.monthly_budget : null, archived: false }).select().single();
        if (saveError || !data) { setError("No se ha podido añadir la categoría."); return; }
        setItems((current) => [...current, data]); setNotice("Categoría añadida");
      } else if (editing) {
        const { error: saveError } = await supabase.from("categories").update({ name: draft.name.trim(), icon: draft.icon, color: draft.color, monthly_budget: draft.type === "expense" ? draft.monthly_budget : null }).eq("id", editing.id);
        if (saveError) { setError(`No se ha podido guardar «${editing.name}».`); return; }
        setItems((current) => current.map((item) => item.id === editing.id ? { ...item, ...draft, name: draft.name.trim() } : item)); setNotice("Categoría guardada");
      }
      window.setTimeout(() => setNotice(""), 2200); closeEditor(true); router.refresh();
    });
  };
  const removeMobile = () => {
    if (!editing) return;
    if (!window.confirm(`¿Eliminar «${editing.name}»? Los movimientos se conservarán sin categoría.`)) return;
    startTransition(async () => {
      const { error: deleteError } = await createClient().from("categories").delete().eq("id", editing.id);
      if (deleteError) { setError(`No se ha podido eliminar «${editing.name}».`); return; }
       setItems((current) => current.filter((item) => item.id !== editing.id)); setNotice("Categoría eliminada"); window.setTimeout(() => setNotice(""), 2200); closeEditor(true); router.refresh();
    });
  };

  return <div className="max-w-4xl space-y-4">
    <PageHeading description="Organiza tus categorías y define un límite mensual para cada gasto." backHref="/settings" />
    {(["expense", "income"] as const).map((type) => <Card key={type} className="hidden p-4 md:block md:p-6">
      <CardHeader title={type === "expense" ? "Gastos" : "Ingresos"} action={<Button type="button" variant="quiet" className="px-3" onClick={() => add(type)}><Plus size={16}/>Añadir</Button>} />
      <div className="space-y-3">{items.filter((item) => item.type === type).map((item) => <article key={item.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-[var(--line)] p-3 lg:grid-cols-[40px_minmax(120px,1fr)_minmax(120px,160px)_auto_128px_44px] lg:gap-3 lg:border-0 lg:p-0">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: item.color, backgroundColor: `color-mix(in srgb, ${item.color} 14%, transparent)` }}><CategoryIcon name={item.icon} size={18}/></span>
        <label className="min-w-0"><span className="sr-only">Nombre de categoría</span><input aria-label="Nombre de categoría" value={item.name} onChange={(event) => update(item.id, "name", event.target.value)} onBlur={(event) => persist(item.id, "name", event.target.value)} maxLength={48} className="control !min-h-10 min-w-0 px-3 text-sm" /></label>
        <label className="col-start-2 min-w-0 lg:col-start-auto"><span className="sr-only">Presupuesto mensual en euros</span>{type === "expense" ? <input aria-label="Presupuesto mensual en euros" type="number" min="0" step="0.01" value={item.monthly_budget ?? ""} onChange={(event) => update(item.id, "monthly_budget", event.target.value)} onBlur={(event) => persist(item.id, "monthly_budget", event.target.value)} placeholder="Límite €" className="control !min-h-10 px-2 text-xs" /> : <span className="muted hidden text-xs lg:inline">Ingreso</span>}</label>
        <div className="col-start-2 flex items-center gap-0.5 lg:col-start-auto" aria-label="Color de categoría">{colors.slice(0, 6).map((color) => <button key={color} type="button" aria-label={`Usar color ${color}`} aria-pressed={item.color === color} onClick={async () => { update(item.id, "color", color); const { error: saveError } = await createClient().from("categories").update({ color }).eq("id", item.id); if (saveError) setError(`No se ha podido guardar el color de «${item.name}».`); else router.refresh(); }} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-[var(--soft-blue)] lg:h-8 lg:w-8"><span className={`h-6 w-6 rounded-full border-2 ${item.color === color ? "border-[var(--ink)] p-[3px]" : "border-transparent"}`} style={{ backgroundColor: color, backgroundClip: item.color === color ? "content-box" : undefined }} /></button>)}</div>
        <div className="col-start-2 min-w-0 lg:col-start-auto"><CategoryIconPicker value={item.icon} onChange={async (icon) => { update(item.id, "icon", icon); const { error: saveError } = await createClient().from("categories").update({ icon }).eq("id", item.id); if (saveError) setError(`No se ha podido guardar el icono de «${item.name}».`); else router.refresh(); }} className="w-full" /></div>
        <Button type="button" variant="danger" onClick={() => remove(item)} aria-label={`Eliminar categoría ${item.name}`} className="col-start-3 row-start-1 !min-h-10 !min-w-10 !px-2 lg:col-start-auto lg:row-start-auto"><Trash2 size={16}/></Button>
      </article>)}</div>
    </Card>)}
    {(["expense", "income"] as const).map((type) => <section key={`mobile-${type}`} className="space-y-2 md:hidden">
      <div className="flex items-center justify-between px-1"><h2 className="m-0 text-base font-semibold">{type === "expense" ? "Gastos" : "Ingresos"}</h2><Button type="button" variant="quiet" className="px-3" onClick={() => startAdd(type)}><Plus size={16}/>Añadir</Button></div>
      {items.filter((item) => item.type === type).map((item) => <button key={item.id} type="button" onClick={() => startEdit(item)} className="card flex min-h-[68px] w-full items-center gap-3 p-3 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: item.color, backgroundColor: `color-mix(in srgb, ${item.color} 14%, transparent)` }}><CategoryIcon name={item.icon} size={19}/></span>
        <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold">{item.name}</strong><small className="muted mt-1 block truncate text-xs">{type === "expense" ? item.monthly_budget === null ? "Sin límite" : `Límite ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", useGrouping: "always" }).format(item.monthly_budget)}` : "Ingreso"}</small></span>
        <ChevronRightIcon className="shrink-0 text-[var(--muted)]" />
      </button>)}
    </section>)}
    {(editing || newType) && draft && <div className={`category-editor-backdrop fixed inset-0 z-[70] flex items-end bg-[#101a2c88] backdrop-blur-[2px] md:hidden${editorClosing ? " is-closing" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="category-editor-title" className={`category-editor-sheet max-h-[86dvh] w-full overflow-y-auto rounded-t-[26px] border border-[var(--line)] border-b-0 bg-[var(--surface)] p-5 pb-[max(env(safe-area-inset-bottom),24px)] text-[var(--ink)] shadow-2xl${editorClosing ? " is-closing" : ""}`}>
        <div className="mb-5 flex items-center justify-between"><h2 id="category-editor-title" className="m-0 text-lg font-semibold">{newType ? "Nueva categoría" : "Editar categoría"}</h2><button type="button" aria-label="Cerrar" disabled={pending} onClick={() => closeEditor()} className="icon-button text-[var(--muted)] hover:bg-[var(--soft-blue)]"><X size={18}/></button></div>
        <label className="field-label">Nombre<input autoFocus disabled={editorClosing} maxLength={48} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="control" /></label>
        {draft.type === "expense" && <label className="field-label mt-4">Límite mensual<input type="number" min="0" step="0.01" value={draft.monthly_budget ?? ""} onChange={(event) => setDraft({ ...draft, monthly_budget: event.target.value === "" ? null : Number(event.target.value) })} placeholder="Sin límite" className="control" /></label>}
        <div className="mt-4"><span className="field-label">Color</span><div className="flex flex-wrap gap-1">{colors.map((color) => <button key={color} type="button" aria-label={`Usar color ${color}`} aria-pressed={draft.color === color} onClick={() => setDraft({ ...draft, color })} className={`flex h-11 w-11 items-center justify-center rounded-xl ${draft.color === color ? "bg-[var(--soft-blue)]" : ""}`}><span className="h-7 w-7 rounded-full border-2 border-[var(--surface)] shadow-[0_0_0_1px_var(--line)]" style={{ background: color }} /></button>)}</div></div>
        <div className="mt-4"><span className="field-label">Icono</span><CategoryIconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} mobileSheet={false} className="w-full" /></div>
        {error && <p className="mt-3 text-sm text-[var(--expense)]" role="alert">{error}</p>}
        <Button type="button" disabled={pending} onClick={saveMobile} className="mt-5 w-full">{pending ? "Guardando…" : "Guardar"}</Button>
        {editing && <Button type="button" variant="danger" disabled={pending} onClick={removeMobile} className="mt-2 w-full">Eliminar categoría</Button>}
      </section>
    </div>}
    {error && <p className="rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--expense)]" role="alert">{error}</p>}
    {notice && <p className="text-sm font-medium text-[var(--income)]" role="status" aria-live="polite">{notice}</p>}
    {pending && <p className="muted text-xs" role="status">Guardando…</p>}
  </div>;
}
