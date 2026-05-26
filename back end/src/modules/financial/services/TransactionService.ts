import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../shared/errors/AppError';
import { CreateTransactionInput } from '../dtos/CreateTransactionSchema';
import { UpdateTransactionInput } from '../dtos/UpdateTransactionSchema';

interface CreateTransactionData extends CreateTransactionInput {
    tenantId: string;
    appointmentId?: string;
}

export class TransactionService {
    async create(data: CreateTransactionData) {
        return prisma.transaction.create({ data });
    }

    async listByPeriod(tenantId: string, start: Date, end: Date) {
        return prisma.transaction.findMany({ where: { tenantId, createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    }

    async findById(tenantId: string, transactionId: string) {
        const transaction = await prisma.transaction.findFirst({ where: { id: transactionId, tenantId } });
        if (!transaction) throw new AppError('Transação não encontrada.', 404);
        return transaction;
    }

    async update(tenantId: string, transactionId: string, data: UpdateTransactionInput) {
        const transaction = await prisma.transaction.findFirst({ where: { id: transactionId, tenantId } });
        if (!transaction) throw new AppError('Transação não encontrada.', 404);
        if (transaction.appointmentId) throw new AppError('Transações geradas por agendamentos não podem ser editadas diretamente.', 400);
        return prisma.transaction.update({ where: { id: transactionId }, data });
    }

    async remove(tenantId: string, transactionId: string) {
        const transaction = await prisma.transaction.findFirst({ where: { id: transactionId, tenantId } });
        if (!transaction) throw new AppError('Transação não encontrada.', 404);
        if (transaction.appointmentId) throw new AppError('Transações geradas por agendamentos não podem ser excluídas.', 400);
        await prisma.transaction.delete({ where: { id: transactionId } });
        return { message: 'Transação excluída com sucesso.' };
    }

    async getDailyCashFlow(tenantId: string, start: Date, end: Date) {
        const transactions = await prisma.transaction.findMany({ where: { tenantId, createdAt: { gte: start, lte: end } }, select: { type: true, amount: true, createdAt: true } });
        const byDay: Record<string, { date: string; income: number; expense: number; balance: number }> = {};

        for (const tx of transactions) {
            const day = tx.createdAt.toISOString().slice(0, 10);
            if (!byDay[day]) byDay[day] = { date: day, income: 0, expense: 0, balance: 0 };
            if (tx.type === 'INCOME') byDay[day].income += Number(tx.amount);
            else byDay[day].expense += Number(tx.amount);
        }

        for (const day of Object.values(byDay)) {
            day.balance = Number((day.income - day.expense).toFixed(2));
            day.income = Number(day.income.toFixed(2));
            day.expense = Number(day.expense.toFixed(2));
        }

        return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
    }

    async getSummary(tenantId: string, start: Date, end: Date) {
        const [incomeResult, expenseResult, byCategory, byPaymentMethod, commissionsPending] = await Promise.all([
            prisma.transaction.aggregate({ where: { tenantId, type: 'INCOME', createdAt: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
            prisma.transaction.aggregate({ where: { tenantId, type: 'EXPENSE', createdAt: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
            prisma.transaction.groupBy({ by: ['category', 'type'], where: { tenantId, createdAt: { gte: start, lte: end } }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
            prisma.transaction.groupBy({ by: ['paymentMethod'], where: { tenantId, type: 'INCOME', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
            prisma.commission.aggregate({ where: { tenantId, status: 'PENDING' }, _sum: { amount: true } }),
        ]);

        const totalIncome = Number(incomeResult._sum.amount ?? 0);
        const totalExpense = Number(expenseResult._sum.amount ?? 0);
        const pendingCommissions = Number(commissionsPending._sum.amount ?? 0);

        return {
            period: { start, end },
            totalIncome: totalIncome,
            totalExpense: totalExpense,
            pendingCommissions: pendingCommissions,
            netProfit: totalIncome - totalExpense - pendingCommissions,
            totalTransactions: incomeResult._count + expenseResult._count,
            byCategory: byCategory.map(c => ({ category: c.category, type: c.type, total: Number(c._sum.amount ?? 0) })),
            byPaymentMethod: byPaymentMethod.map(p => ({ method: p.paymentMethod ?? 'N/A', total: Number(p._sum.amount ?? 0) })),
        };
    }
}