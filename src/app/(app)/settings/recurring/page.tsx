import { RecurringView } from "@/components/recurring-view";
import { localToday } from "@/lib/utils";
import { getRecurringTransactions } from "@/lib/data/recurring";
import { getActiveCategories } from "@/lib/data/categories";
export default async function RecurringPage() {
  const [{ recurring }, categories] = await Promise.all([getRecurringTransactions(), getActiveCategories()]);
  return <RecurringView recurring={recurring} categories={categories} today={localToday()} />;
}
