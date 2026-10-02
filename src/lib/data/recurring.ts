import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getRecurringTransactions = cache(async () => {
  const supabase = await createClient();
  const { data: recurring, error: recurringError } = await supabase.from("recurring_transactions").select("id,user_id,category_id,type,amount,description,frequency,next_run,end_date,active,created_at").order("next_run");
  if (recurringError) throw new Error("No se pudieron cargar los movimientos recurrentes.", { cause: recurringError });
  return { recurring };
});
