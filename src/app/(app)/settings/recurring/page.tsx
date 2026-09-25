import { RecurringView } from "@/components/recurring-view";
import { createClient } from "@/lib/supabase/server";
import { localToday } from "@/lib/utils";
export default async function RecurringPage() {
  const supabase = await createClient();
  const [{ data: recurring }, { data: categories }] = await Promise.all([
    supabase.from("recurring_transactions").select("id,user_id,category_id,type,amount,description,frequency,next_run,end_date,active,created_at").order("next_run"),
    supabase.from("categories").select("id,user_id,name,type,icon,color,monthly_budget,archived,created_at").eq("archived", false),
  ]);
  return <RecurringView recurring={recurring ?? []} categories={categories ?? []} today={localToday()} />;
}
