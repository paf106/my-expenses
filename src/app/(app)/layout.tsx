import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveCategories } from "@/lib/data/categories";
import { currentMonth } from "@/lib/utils";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const claims = authData?.claims;
  if (!claims?.sub) redirect("/login");
  const categories = await getActiveCategories();
  return <AppShell categories={categories} initialMonth={currentMonth()}>{children}</AppShell>;
}
