import { StatsView } from "@/components/stats-view";
import { currentMonth, parseMonth } from "@/lib/utils";
import { getMonthlyStats } from "@/lib/data/transactions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Estadísticas" };

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = parseMonth(params.month) || currentMonth();
  const { summary, breakdown, trend } = await getMonthlyStats(month);
  return <StatsView summary={summary} breakdown={breakdown} trend={trend} />;
}
