import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { monthBounds } from "@/lib/utils";

export const transactionColumns = "id,user_id,category_id,recurring_id,type,amount,description,date";

export const getMonthTransactions = cache(async (month: string) => {
  const { start, end } = monthBounds(month);
  const supabase = await createClient();
  const { data, error } = await supabase.from("transactions").select(transactionColumns).gte("date", start).lte("date", end).order("date", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error("No se pudieron cargar los movimientos.", { cause: error });
  return data;
});

export const getMonthlyStats = cache(async (month: string) => {
  const { start, end } = monthBounds(month);
  const supabase = await createClient();
  const [{ data: summary, error: summaryError }, { data: breakdown, error: breakdownError }, { data: trend, error: trendError }] = await Promise.all([
    supabase.rpc("month_summary", { p_month: `${month}-01` }),
    supabase.rpc("category_breakdown", { p_from: start, p_to: end }),
    supabase.rpc("monthly_trend", { p_month: `${month}-01`, p_months: 6 }),
  ]);
  if (summaryError || breakdownError || trendError) throw new Error("No se pudieron cargar las estadísticas.", { cause: summaryError || breakdownError || trendError });
  return { summary: summary?.[0] || { income: 0, expenses: 0, savings: 0 }, breakdown: breakdown || [], trend: trend || [] };
});
