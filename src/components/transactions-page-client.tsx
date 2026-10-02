"use client";

import type { Category, Transaction } from "@/lib/supabase/types";
import { TransactionsView } from "@/components/transactions-view";
import { useTransactionDialog } from "@/components/transaction-dialog-context";

export function TransactionsPageClient(props: { month: string; transactions: Transaction[]; categories: Category[]; initialType: string; initialCategory: string; initialSearch: string }) {
  const { openEdit } = useTransactionDialog();
  return <TransactionsView {...props} onEdit={openEdit}/>;
}
