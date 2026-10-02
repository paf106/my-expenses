"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { navItems } from "@/components/app-shell/navigation-items";

export function MobileNavigation({ activePath, showAdd, onAdd, offline = false }: { activePath: string; showAdd: boolean; onAdd: () => void; offline?: boolean }) {
  return <div className="mobile-nav-row fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-3 right-3 z-30 flex items-center gap-2.5 md:hidden">
    <nav aria-label="Navegación móvil" className={`mobile-nav-float grid min-w-0 flex-1 grid-cols-4 gap-0.5 p-1.5 ${showAdd ? "" : "w-full"}`}>{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={activePath === href ? "page" : undefined} className={`mobile-nav-link flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[20px] text-[10px] no-underline ${activePath === href ? "is-active" : ""}`}><span className="mobile-nav-icon"><Icon size={20} strokeWidth={2}/></span><span className="truncate">{label}</span></Link>)}</nav>
    {showAdd && <button aria-label={offline ? "Añadir movimiento (requiere conexión)" : "Añadir movimiento"} title={offline ? "Vuelve a conectarte para añadir movimientos" : undefined} disabled={offline} onClick={onAdd} className="mobile-fab flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"><Plus size={25} strokeWidth={2.2} /></button>}
  </div>;
}
