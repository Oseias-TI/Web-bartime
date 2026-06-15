import { CreateTransactionInput } from '../dtos/CreateTransactionSchema';
import { UpdateTransactionInput } from '../dtos/UpdateTransactionSchema';

export interface ICreateTransactionData extends CreateTransactionInput {
    tenantId: string;
    appointmentId?: string;
}

export interface ITransactionSummary {
    period: { start: Date; end: Date };
    totalIncome: number;
    totalExpense: number;
    pendingCommissions: number;
    netProfit: number;
    totalTransactions: number;
    byCategory: Array<{ category: string; type: string; total: number }>;
    byPaymentMethod: Array<{ method: string; total: number }>;
}

export interface ITransactionRepository {
    create(data: ICreateTransactionData): Promise<any>;
    listByPeriod(tenantId: string, start: Date, end: Date): Promise<any[]>;
    findById(tenantId: string, transactionId: string): Promise<any | null>;
    update(id: string, data: UpdateTransactionInput): Promise<any>;
    remove(id: string): Promise<void>;
    getDailyCashFlow(tenantId: string, start: Date, end: Date): Promise<any[]>;
    getSummary(tenantId: string, start: Date, end: Date, pendingCommissions: number): Promise<ITransactionSummary>;
}
