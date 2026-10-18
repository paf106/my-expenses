import { RecurringView } from "@/components/recurring-view";
import { localToday } from "@/lib/utils";
import { getRecurringTransactions } from "@/lib/data/recurring";
import { getActiveCategories } from "@/lib/data/categories";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Movimientos recurrentes" };
export default async function RecurringPage() {
  const [{ recurring }, categories] = await Promise.all([getRecurringTransactions(), getActiveCategories()]);
  return <RecurringView recurring={recurring} categories={categories} today={localToday()} />;
}
