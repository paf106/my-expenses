"use client";

import { createContext, useContext } from "react";
import type { MonthTransaction, TransactionType } from "@/lib/supabase/types";

type TransactionDialogContextValue = {
  openNew: (type?: TransactionType) => void;
  openEdit: (transaction: MonthTransaction) => void;
};

export const TransactionDialogContext = createContext<TransactionDialogContextValue | null>(null);

export function useTransactionDialog() {
  const context = useContext(TransactionDialogContext);
  if (!context) throw new Error("useTransactionDialog must be used within AppShell");
  return context;
}
