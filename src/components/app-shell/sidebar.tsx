"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { navItems } from "@/components/app-shell/navigation-items";

export function Sidebar({ activePath, onLogout }: { activePath: string; onLogout: () => void }) {
  return <aside className="sidebar fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col px-5 py-7 md:flex">
    <Link href="/dashboard" className="mb-9 flex items-center gap-3 px-2 no-underline"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-xl font-bold text-[var(--primary-ink)]">€</span><span><strong className="block text-[17px] tracking-tight">Mis Gastos</strong><small className="muted">Finanzas en calma</small></span></Link>
    <nav className="flex flex-col gap-1" aria-label="Navegación principal">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={activePath === href ? "page" : undefined} className="nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium no-underline"><Icon size={19} strokeWidth={1.8} />{label}</Link>)}</nav>
    <div className="mt-auto border-t border-[var(--line)] pt-4"><button onClick={onLogout} className="nav-link flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm"><LogOut size={18} />Cerrar sesión</button></div>
  </aside>;
}
