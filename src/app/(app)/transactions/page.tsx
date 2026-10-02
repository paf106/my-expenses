import { currentMonth } from "@/lib/utils";
import { TransactionsView } from "@/components/transactions-view";
import { getActiveCategories } from "@/lib/data/categories";
import { getMonthTransactions } from "@/lib/data/transactions";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : currentMonth();
  const [transactions, categories] = await Promise.all([getMonthTransactions(month), getActiveCategories()]);
  return <TransactionsView month={month} transactions={transactions} categories={categories} />;
}
