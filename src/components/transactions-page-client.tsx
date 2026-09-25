"use client";

import type { Category, Transaction } from "@/lib/supabase/types";
import { TransactionsView } from "@/components/transactions-view";

export function TransactionsPageClient(props: { month: string; transactions: Transaction[]; categories: Category[]; initialType: string; initialCategory: string; initialSearch: string }) {
  const onEdit = (transaction: Transaction) => window.dispatchEvent(new CustomEvent("my-expenses:edit-transaction", { detail: transaction }));
  return <TransactionsView {...props} onEdit={onEdit}/>;
}
