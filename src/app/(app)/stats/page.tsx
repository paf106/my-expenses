import { StatsView } from "@/components/stats-view";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, monthBounds } from "@/lib/utils";

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : currentMonth();
  const { start, end } = monthBounds(month);
  const supabase = await createClient();
  const [{ data: summary }, { data: breakdown }, { data: trend }] = await Promise.all([
    supabase.rpc("month_summary", { p_month: `${month}-01` }),
    supabase.rpc("category_breakdown", { p_from: start, p_to: end }),
    supabase.rpc("monthly_trend", { p_month: `${month}-01`, p_months: 6 }),
  ]);
  return <StatsView summary={summary?.[0] || { income: 0, expenses: 0, savings: 0 }} breakdown={breakdown || []} trend={trend || []} />;
}
