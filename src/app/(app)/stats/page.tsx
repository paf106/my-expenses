import { StatsView } from "@/components/stats-view";
import { currentMonth } from "@/lib/utils";
import { getMonthlyStats } from "@/lib/data/transactions";

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : currentMonth();
  const { summary, breakdown, trend } = await getMonthlyStats(month);
  return <StatsView summary={summary} breakdown={breakdown} trend={trend} />;
}
