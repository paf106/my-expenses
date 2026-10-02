import Link from "next/link";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { euro } from "@/lib/utils";

const CategoryChart = dynamic(() => import("@/components/charts").then((module) => module.CategoryChart), {
  ssr: false,
  loading: () => <div className="mx-auto aspect-square w-full max-w-[210px] animate-pulse rounded-full bg-[var(--soft-blue)]" />,
});

export function CategoryBreakdownCard({ data }: { data: { id: string; name: string; total: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  const top = data.slice(0, 4);
  return <section className="card flex h-full min-w-0 flex-col p-5 md:p-6">
    <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="m-0 text-base font-semibold">A dónde va</h2><p className="muted mb-0 mt-1 text-sm">Gastos por categoría</p></div><Link href="/stats" className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-[var(--ink)] no-underline hover:bg-[var(--soft-blue)]">Ver más <ArrowRight size={15} /></Link></div>
    <div className="grid flex-1 grid-cols-[minmax(120px,1fr)_minmax(100px,.9fr)] items-center gap-3 sm:gap-5">
      <div className="relative mx-auto w-full max-w-[210px]"><CategoryChart data={data.map(({ name, total: value, color }) => ({ name, value, color }))} height={210} />{data.length > 0 && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="muted text-[11px]">Total</span><strong className="amount text-sm">{euro(total)}</strong></div>}</div>
      <ul className="m-0 flex min-w-0 list-none flex-col gap-3 p-0">{top.length ? top.map((item) => <li key={item.id} className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="min-w-0 flex-1 truncate text-xs sm:text-sm">{item.name}</span><strong className="amount shrink-0 text-xs font-medium">{euro(item.total)}</strong></li>) : <li className="muted text-sm">Apunta tu primer gasto para ver el desglose.</li>}</ul>
    </div>
  </section>;
}
