import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveCategories } from "@/lib/data/categories";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [{ data: authData }, categories] = await Promise.all([supabase.auth.getClaims(), getActiveCategories()]);
  const claims = authData?.claims;
  if (!claims?.sub) redirect("/login");
  return <AppShell categories={categories}>{children}</AppShell>;
}
