import { api } from "@/lib/api";

export interface Transaction {
  id: string;
  tenantId: string;
  appointmentId: string | null;
  type: "INCOME" | "EXPENSE";
  category: string;
  paymentMethod: string | null;
  amount: number;
  description: string | null;
  createdAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  pendingCommissions: number;
}

export interface CashFlow {
  date: string;
  income: number;
  expense: number;
}

export interface CreateTransactionData {
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description?: string;
  paymentMethod?: string;
}

export const financialService = {
  listTransactions: (params?: Record<string, string>) =>
    api.get<Transaction[]>("/financial/transactions", params),

  getTransaction: (id: string) =>
    api.get<Transaction>(`/financial/transactions/${id}`),

  createTransaction: (data: CreateTransactionData) =>
    api.post<Transaction>("/financial/transactions", data),

  updateTransaction: (id: string, data: Partial<CreateTransactionData>) =>
    api.patch<Transaction>(`/financial/transactions/${id}`, data),

  deleteTransaction: (id: string) =>
    api.delete(`/financial/transactions/${id}`),

  getCashFlow: (params?: Record<string, string>) =>
    api.get<CashFlow[]>("/financial/cash-flow", params),

  getSummary: (params?: Record<string, string>) =>
    api.get<FinancialSummary>("/financial/summary", params),

  payout: (professionalId: string) =>
    api.post("/financial/payout", { professionalId }),
};
