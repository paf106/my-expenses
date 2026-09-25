import { AccountView } from "@/components/account-view";
import { createClient } from "@/lib/supabase/server";
export default async function AccountPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  return <AccountView email={user?.email || ""}/>;
}
