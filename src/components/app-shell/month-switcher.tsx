"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { IconButton } from "@/components/ui/primitives";
import { monthLabel } from "@/lib/utils";

export function MonthSwitcher({ month, isCurrentMonth, pending, onMove }: { month: string; isCurrentMonth: boolean; pending: boolean; onMove: (amount: number) => void }) {
  return <div className="flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] p-0.5">
    <IconButton aria-label="Mes anterior" onClick={() => onMove(-1)} className="min-w-10"><ArrowLeft size={17}/></IconButton>
    <span aria-live="polite" className={`min-w-[96px] px-1 text-center text-xs font-semibold transition-opacity sm:min-w-[124px] sm:text-sm ${pending ? "opacity-45" : ""}`}>{monthLabel(month)}</span>
    <IconButton aria-label="Mes siguiente" disabled={isCurrentMonth} onClick={() => onMove(1)} className="min-w-10 disabled:cursor-not-allowed disabled:opacity-35"><ArrowRight size={17}/></IconButton>
  </div>;
}
