import { createClient } from "@/lib/supabase/server";
import { currentMonth, monthBounds, normalizeSearch } from "@/lib/utils";
import { TransactionsPageClient } from "@/components/transactions-page-client";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ month?: string; type?: string; category?: string; q?: string }> }) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : currentMonth();
  const bounds = monthBounds(month);
  const supabase = await createClient();
  let query = supabase.from("transactions").select("id,user_id,category_id,recurring_id,type,amount,description,date,created_at").gte("date", bounds.start).lte("date", bounds.end).order("date", { ascending: false }).order("created_at", { ascending: false });
  if (params.type === "income" || params.type === "expense") query = query.eq("type", params.type);
  if (params.category) query = query.eq("category_id", params.category);
  const [{ data: transactions }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id,user_id,name,type,icon,color,monthly_budget,archived,created_at").eq("archived", false),
  ]);
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category]));
  const searchTerm = normalizeSearch(params.q || "");
  const enrichedTransactions = (transactions ?? [])
    .map((transaction) => ({ ...transaction, category: transaction.category_id ? categoryMap.get(transaction.category_id) ?? null : null }))
    .filter((transaction) => !searchTerm || normalizeSearch(`${transaction.description} ${transaction.category?.name || ""}`).includes(searchTerm));
  return <TransactionsPageClient month={month} transactions={enrichedTransactions} categories={categories ?? []} initialType={params.type || "all"} initialCategory={params.category || "all"} initialSearch={params.q || ""} />;
}
