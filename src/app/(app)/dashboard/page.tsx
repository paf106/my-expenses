import { Dashboard } from "@/components/dashboard";
import { currentMonth, parseMonth } from "@/lib/utils";
import { getActiveCategories } from "@/lib/data/categories";
import { getMonthTransactions } from "@/lib/data/transactions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inicio" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = parseMonth(params.month) || currentMonth();
  const [transactions, categories] = await Promise.all([getMonthTransactions(month), getActiveCategories()]);
  return <Dashboard month={month} transactions={transactions} categories={categories} />;
}
