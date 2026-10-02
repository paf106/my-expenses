import { AccountView } from "@/components/account-view";
import { createClient } from "@/lib/supabase/server";
export default async function AccountPage() {
  const supabase = await createClient(); const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return <AccountView email={typeof claims?.email === "string" ? claims.email : ""}/>;
}
