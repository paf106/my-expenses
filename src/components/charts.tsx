"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

type Breakdown = { name: string; value: number; color: string };
type Trend = { month: string; income: number; expenses: number };
const euroTick = (value: number) => new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export function CategoryChart({ data, height = 210 }: { data: Breakdown[]; height?: number }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return <div style={{ width: "100%", height }} aria-label="Gráfico de gastos por categoría">
    {data.length ? <ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={3} stroke="none">{data.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={entry.color} />)}</Pie><Tooltip wrapperStyle={{ zIndex: 50, pointerEvents: "none" }} content={({ active, payload }) => {
      const item = payload?.[0]?.payload as Breakdown | undefined;
      if (!active || !item) return null;
      const amount = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(item.value);
      const percentage = total > 0 ? Math.round(item.value / total * 100) : 0;
      return <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[var(--ink)] shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</div>
        <div className="mt-1 pl-[18px] text-xs"><strong className="amount">{amount}</strong><span className="muted"> · {percentage}%</span></div>
      </div>;
    }} /></PieChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">Aún no hay gastos este mes</div>}
  </div>;
}

export function TrendChart({ data }: { data: Trend[] }) {
  return <div className="h-[260px] w-full" aria-label="Ingresos y gastos por mes"><ResponsiveContainer><BarChart data={data} margin={{ top: 10, right: 2, left: -20, bottom: 0 }} barGap={5}>
    <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
    <YAxis tickFormatter={euroTick} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
    <Tooltip formatter={(value, name) => [new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value)), name === "income" ? "Ingresos" : "Gastos"]} contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }} />
    <Legend formatter={(value) => value === "income" ? "Ingresos" : "Gastos"} />
    <Bar dataKey="income" fill="var(--income)" radius={[5, 5, 0, 0]} maxBarSize={20} />
    <Bar dataKey="expenses" fill="var(--expense)" radius={[5, 5, 0, 0]} maxBarSize={20} />
  </BarChart></ResponsiveContainer></div>;
}
