import { Dashboard } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, monthBounds } from "@/lib/utils";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : currentMonth();
  const { start, end } = monthBounds(month);
  const supabase = await createClient();
  const [{ data: transactions }, { data: categories }, { data: summary }] = await Promise.all([
    supabase.from("transactions").select("id,user_id,category_id,recurring_id,type,amount,description,date,created_at").gte("date", start).lte("date", end).order("date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("categories").select("id,user_id,name,type,icon,color,monthly_budget,archived,created_at").eq("archived", false),
    supabase.rpc("month_summary", { p_month: `${month}-01` }),
  ]);
  const summaryRow = summary?.[0];
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category]));
  const enrichedTransactions = (transactions ?? []).map((transaction) => ({ ...transaction, category: transaction.category_id ? categoryMap.get(transaction.category_id) ?? null : null }));
  return <Dashboard month={month} transactions={enrichedTransactions} categories={categories ?? []} summary={summaryRow ?? { income: 0, expenses: 0, savings: 0 }} />;
}
