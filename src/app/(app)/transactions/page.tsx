import { currentMonth } from "@/lib/utils";
import { TransactionsPageClient } from "@/components/transactions-page-client";
import { getActiveCategories } from "@/lib/data/categories";
import { getMonthTransactions } from "@/lib/data/transactions";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ month?: string; type?: string; category?: string; q?: string }> }) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : currentMonth();
  const [transactions, categories] = await Promise.all([getMonthTransactions(month), getActiveCategories()]);
  return <TransactionsPageClient month={month} transactions={transactions} categories={categories} initialType={params.type || "all"} initialCategory={params.category || "all"} initialSearch={params.q || ""} />;
}
