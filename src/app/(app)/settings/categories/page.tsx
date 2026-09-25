import { CategoriesView } from "@/components/categories-view";
import { createClient } from "@/lib/supabase/server";
export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id,user_id,name,type,icon,color,monthly_budget,archived,created_at").order("type").order("name");
  return <CategoriesView categories={data ?? []}/>;
}
