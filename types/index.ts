export type Role = "admin" | "user";
export type TransactionType = "income" | "expense";
export type Category =
  | "salary"
  | "freelance"
  | "investment"
  | "gift"
  | "other_income"
  | "food"
  | "transport"
  | "housing"
  | "entertainment"
  | "health"
  | "shopping"
  | "education"
  | "utilities"
  | "other_expense";

export interface TransactionFilters {
  type?: TransactionType;
  category?: Category;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  category: Category;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  income: number;
  expense: number;
  net: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
