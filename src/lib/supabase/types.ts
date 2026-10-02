export type TransactionType = "expense" | "income";
export type Frequency = "weekly" | "monthly" | "yearly";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  monthly_budget: number | null;
  archived: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  recurring_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  category?: Pick<Category, "id" | "name" | "icon" | "color" | "type"> | null;
};

export type MonthTransaction = Pick<Transaction, "id" | "category_id" | "recurring_id" | "type" | "amount" | "description" | "date">;

export type RecurringTransaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  frequency: Frequency;
  next_run: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
};

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      categories: Table<Category, Omit<Category, "id" | "created_at"> & { id?: string; user_id?: string; created_at?: string }>;
      transactions: Table<Transaction, Omit<Transaction, "id" | "created_at" | "category" | "user_id" | "recurring_id"> & { id?: string; user_id?: string; recurring_id?: string | null; created_at?: string }>;
      recurring_transactions: Table<RecurringTransaction, Omit<RecurringTransaction, "id" | "created_at" | "user_id"> & { id?: string; user_id?: string; created_at?: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      month_summary: { Args: { p_month: string }; Returns: { income: number; expenses: number; savings: number }[] };
      category_breakdown: { Args: { p_from: string; p_to: string }; Returns: { category_id: string; category_name: string; category_icon: string; category_color: string; total: number; count: number }[] };
      monthly_trend: { Args: { p_month?: string; p_months?: number }; Returns: { month: string; income: number; expenses: number }[] };
      run_recurring: { Args: Record<PropertyKey, never>; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
