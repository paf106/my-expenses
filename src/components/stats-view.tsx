import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, BarChart3, ChartPie, PiggyBank } from "lucide-react";
import { euro, fromCents, monthLabel, toCents } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryChartClient, TrendChartClient } from "@/components/charts/chart-islands";

const trendMonthFormatter = new Intl.DateTimeFormat("es-ES", { month: "short", year: "2-digit", timeZone: "UTC" });

export function StatsView({ month, summary, breakdown, trend }: {
  month: string;
  summary: { income: number; expenses: number; savings: number };
  breakdown: { category_id: string | null; category_name: string; category_icon: string; category_color: string; total: number; count: number }[];
  trend: { month: string; income: number; expenses: number }[];
}) {
  const income = Number(summary.income);
  const expenses = Number(summary.expenses);
  const savings = fromCents(toCents(income) - toCents(expenses));
  const pieData = breakdown.map((item) => ({ name: item.category_name, value: Number(item.total), color: item.category_color }));
  const trendData = trend.map((item) => ({ month: trendMonthFormatter.format(new Date(`${item.month.slice(0, 7)}-01T12:00:00Z`)), income: Number(item.income), expenses: Number(item.expenses) }));
  const hasActivity = income !== 0 || expenses !== 0;
  const categoryTotalCents = breakdown.reduce((sum, item) => sum + toCents(Number(item.total)), 0);
  const overspent = savings < 0;

  return <div className="motion-enter space-y-4 xl:space-y-6">
    <p className="muted m-0 text-sm">Resumen de <span className="font-semibold capitalize text-[var(--ink)]">{monthLabel(month)}</span></p>
    <section aria-label={`Resumen financiero de ${monthLabel(month)}`} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <article className="card min-w-0 p-3 sm:p-4 md:p-5"><span className="mb-2 inline-flex rounded-xl bg-[var(--soft-blue)] p-2 text-[var(--income)]"><ArrowDownLeft aria-hidden="true" size={18}/></span><p className="muted mb-1 text-xs">Ingresos</p><p className="amount m-0 break-words text-base font-semibold sm:text-lg">{euro(income)}</p></article>
      <article className="card min-w-0 p-3 sm:p-4 md:p-5"><span className="mb-2 inline-flex rounded-xl bg-[var(--soft-blue)] p-2 text-[var(--expense)]"><ArrowUpRight aria-hidden="true" size={18}/></span><p className="muted mb-1 text-xs">Gastos</p><p className="amount m-0 break-words text-base font-semibold sm:text-lg">{euro(expenses)}</p></article>
      <article className={`card col-span-2 flex min-w-0 items-center gap-3 p-3 sm:col-span-1 sm:p-4 md:p-5 ${overspent ? "border-[color-mix(in_srgb,var(--expense)_38%,var(--line))]" : ""}`}>
        <span className={`inline-flex shrink-0 rounded-xl bg-[var(--soft-blue)] p-2 ${overspent ? "text-[var(--expense)]" : "text-[var(--brass)]"}`}><PiggyBank aria-hidden="true" size={18}/></span>
        <div className="min-w-0"><p className="muted mb-1 text-xs">{overspent ? "Balance negativo" : "Ahorro"}</p><p className={`amount m-0 break-words text-base font-semibold sm:text-lg ${overspent ? "text-[var(--expense)]" : ""}`}>{euro(savings)}</p></div>
      </article>
    </section>

    {!hasActivity && <div className="card flex flex-col items-center gap-3 p-4 text-center sm:flex-row sm:text-left"><span aria-hidden="true" className="rounded-xl bg-[var(--soft-blue)] p-2 text-[var(--accent)]"><ChartPie size={18}/></span><p className="muted m-0 flex-1 text-sm">Aún no hay movimientos en {monthLabel(month)}. Cuando añadas alguno, aquí aparecerán los resúmenes y gráficos.</p><Link href="/dashboard?add=expense" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--accent)] no-underline hover:bg-[var(--soft-blue)]">Añadir movimiento</Link></div>}

    <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2 xl:gap-6">
      <Card className="order-1 flex h-full min-w-0 flex-col xl:order-2">
        <CardHeader title="Gastos por categoría" description={`Distribución de ${monthLabel(month)}`} />
        {pieData.length ? <>
          <div className="relative h-[210px] sm:h-[230px]"><CategoryChartClient data={pieData} height={230}/><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="muted text-[10px]">Total</span><strong className="amount text-base">{euro(expenses)}</strong></div></div>
          <ul aria-label="Detalle de gastos por categoría" className="motion-list m-0 list-none divide-y divide-[var(--line)] p-0">
            {breakdown.map((item) => {
              const percentage = categoryTotalCents > 0 ? Math.round(toCents(Number(item.total)) / categoryTotalCents * 100) : 0;
              return <li key={item.category_id || "uncategorized"} className="flex min-h-12 items-center gap-2 py-2 text-sm">
                <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.category_color }}/>
                <span className="min-w-0 flex-1 truncate">{item.category_name}<span className="muted ml-1 text-xs">· {item.count} {item.count === 1 ? "movimiento" : "movimientos"}</span></span>
                <span className="muted shrink-0 text-xs">{percentage}%</span><strong className="amount shrink-0 text-xs">{euro(Number(item.total))}</strong>
              </li>;
            })}
          </ul>
        </> : <EmptyState icon={<ChartPie size={20}/>} title="Todavía no hay gastos" description="Apunta un gasto y verás a dónde va tu dinero."/>}
      </Card>

      <Card className="order-2 flex h-full min-w-0 flex-col xl:order-1">
        <CardHeader title="Ingresos y gastos" description="Comparativa de los últimos seis meses" />
        {trendData.some((item) => item.income > 0 || item.expenses > 0) ? <>
          <TrendChartClient data={trendData}/>
          <table className="sr-only"><caption>Datos mensuales de ingresos y gastos</caption><thead><tr><th scope="col">Mes</th><th scope="col">Ingresos</th><th scope="col">Gastos</th></tr></thead><tbody>{trendData.map((item) => <tr key={item.month}><th scope="row">{item.month}</th><td>{euro(item.income)}</td><td>{euro(item.expenses)}</td></tr>)}</tbody></table>
        </> : <EmptyState icon={<BarChart3 size={20}/>} title="Aún no hay tendencia" description="Añade movimientos durante varios meses para ver la comparativa."/>}
      </Card>
    </div>
  </div>;
}
