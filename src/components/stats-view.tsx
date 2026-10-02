"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";
import { euro } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/primitives";

const CategoryChart = dynamic(() => import("@/components/charts").then((module) => module.CategoryChart), { ssr: false, loading: () => <div className="mx-auto aspect-square w-full max-w-[230px] animate-pulse rounded-full bg-[var(--soft-blue)]" /> });
const TrendChart = dynamic(() => import("@/components/charts").then((module) => module.TrendChart), { ssr: false, loading: () => <div className="h-[260px] w-full animate-pulse rounded-2xl bg-[var(--soft-blue)]" /> });

export function StatsView({ summary, breakdown, trend }: { summary: { income: number; expenses: number; savings: number }; breakdown: { category_id: string; category_name: string; category_icon: string; category_color: string; total: number; count: number }[]; trend: { month: string; income: number; expenses: number }[] }) {
  const income = Number(summary.income);
  const expenses = Number(summary.expenses);
  const pieData = useMemo(() => breakdown.map((item) => ({ name: item.category_name, value: Number(item.total), color: item.category_color })), [breakdown]);
  const trendData = trend.map((item) => ({ month: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(`${item.month.slice(0, 7)}-01T12:00:00`)), income: Number(item.income), expenses: Number(item.expenses) }));
  return <div className="motion-stagger grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2 xl:gap-6">
    <section className="col-span-1 grid grid-cols-3 gap-2 lg:col-span-2 sm:gap-3">{[{ label: "Ingresos", amount: income, icon: ArrowDownLeft, color: "var(--income)" }, { label: "Gastos", amount: expenses, icon: ArrowUpRight, color: "var(--expense)" }, { label: "Ahorro", amount: income - expenses, icon: PiggyBank, color: "var(--brass)" }].map(({ label, amount, icon: Icon, color }) => <article key={label} className="card min-w-0 p-2.5 sm:p-4 md:p-5"><span className="mb-2 inline-flex rounded-xl bg-[var(--soft-blue)] p-2" style={{ color }}><Icon size={17}/></span><p className="muted mb-1 truncate text-[10px] sm:text-xs">{label}</p><p className="amount m-0 truncate text-[11px] font-semibold sm:text-sm md:text-lg">{euro(amount)}</p></article>)}</section>
    <Card className="flex h-full flex-col"><CardHeader title="Ingresos y gastos" description="Evolución de los últimos meses" />{trendData.length ? <TrendChart data={trendData}/> : <div className="flex h-[260px] flex-1 items-center justify-center text-sm text-[var(--muted)]">Aún no hay datos suficientes.</div>}</Card>
     <Card className="flex h-full flex-col"><CardHeader title="Gastos por categoría" description="Distribución de este mes" /><div className="relative"><CategoryChart data={pieData} height={230}/>{pieData.length > 0 && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="muted text-[10px]">Total</span><strong className="amount text-base">{euro(expenses)}</strong></div>}</div><ul className="m-0 list-none space-y-3 p-0">{pieData.map((item) => <li key={item.name} className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }}/><span className="min-w-0 flex-1 truncate">{item.name}</span><strong className="amount text-xs">{euro(item.value)}</strong></li>)}</ul></Card>
  </div>;
}
