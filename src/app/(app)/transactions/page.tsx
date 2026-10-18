import { currentMonth, parseMonth } from "@/lib/utils";
import { TransactionsView } from "@/components/transactions-view";
import { getActiveCategories } from "@/lib/data/categories";
import { getMonthTransactions } from "@/lib/data/transactions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Movimientos" };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = parseMonth(params.month) || currentMonth();
  const [transactions, categories] = await Promise.all([getMonthTransactions(month), getActiveCategories()]);
  return <TransactionsView month={month} transactions={transactions} categories={categories} />;
}
