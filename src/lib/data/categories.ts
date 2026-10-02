import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const categoryColumns = "id,user_id,name,type,icon,color,monthly_budget,archived,created_at";

export const getCategories = cache(async (includeArchived = false) => {
  const supabase = await createClient();
  let query = supabase.from("categories").select(categoryColumns);
  if (!includeArchived) query = query.eq("archived", false);
  const { data, error } = await query.order("type").order("name");
  if (error) throw new Error("No se pudieron cargar las categorías.", { cause: error });
  return data;
});

export const getActiveCategories = () => getCategories(false);
