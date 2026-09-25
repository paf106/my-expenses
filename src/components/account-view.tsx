"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/app-providers";
import { createClient } from "@/lib/supabase/client";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/primitives";

export function AccountView({ email }: { email: string }) {
  const { theme, setTheme } = useTheme(); const router = useRouter();
  const choices = [{ value: "light" as const, label: "Claro", icon: Sun }, { value: "dark" as const, label: "Oscuro", icon: Moon }, { value: "system" as const, label: "Sistema", icon: Monitor }];
  return <div className="max-w-2xl space-y-4"><PageHeading description="Administra tu sesión y el aspecto de la aplicación." backHref="/settings"/><section className="card p-5 md:p-6"><h2 className="m-0 text-base font-semibold">Apariencia</h2><p className="muted mb-4 mt-1 text-sm">Elige cómo quieres ver tu espacio.</p><div className="grid grid-cols-3 gap-2">{choices.map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setTheme(value)} aria-pressed={theme === value} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium ${theme === value ? "border-[var(--focus)] bg-[var(--soft-blue)]" : "border-[var(--line)]"}`}><Icon size={18}/>{label}</button>)}</div></section>
    <section className="card p-5 sm:p-6"><h2 className="m-0 text-base font-semibold">Tu cuenta</h2><p className="muted mb-4 mt-1 text-sm">Tu sesión es privada y está protegida por Supabase.</p><div><span className="mb-2 block text-sm font-medium">Correo electrónico</span><p className="m-0 min-h-11 break-all rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-sm">{email}</p><p className="muted mb-0 mt-2 text-xs">El correo se gestiona desde el panel de Supabase.</p></div></section>
    <section className="card flex items-center justify-between gap-4 p-5"><div><h2 className="m-0 text-sm font-semibold">Contraseña</h2><p className="muted mb-0 mt-1 text-xs">Te enviaremos un enlace para cambiarla.</p></div><Link href="/forgot-password" className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-semibold no-underline">Cambiar</Link></section>
    <Button variant="danger" onClick={async () => { await createClient().auth.signOut(); router.push("/login"); router.refresh(); }} className="justify-start px-2">Cerrar sesión</Button>
  </div>;
}
